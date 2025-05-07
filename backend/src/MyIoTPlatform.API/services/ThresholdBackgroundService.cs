using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MyIoTPlatform.API.Models;
using MyIoTPlatform.API.Services;
using MyIoTPlatform.Application.Interfaces.Communication;

namespace MyIoTPlatform.API.Services
{
    public class ThresholdBackgroundService : BackgroundService
    {
        private readonly ILogger<ThresholdBackgroundService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly IMqttClientService _mqttClientService;
        private TimeSpan _checkInterval = TimeSpan.FromMinutes(5); // Kiểm tra mỗi 5 phút

        public ThresholdBackgroundService(
            ILogger<ThresholdBackgroundService> logger,
            IServiceProvider serviceProvider,
            IMqttClientService mqttClientService)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
            _mqttClientService = mqttClientService;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ThresholdBackgroundService đang khởi động...");

            while (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("Đang kiểm tra ngưỡng quá tải cho tất cả thiết bị...");

                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var mongoDbService = scope.ServiceProvider.GetRequiredService<MongoDbService>();
                        
                        // Lấy tất cả thiết bị có trạng thái BẬT
                        var activeDevices = await mongoDbService.GetActiveDevicesAsync();
                        
                        foreach (var device in activeDevices)
                        {
                            await CheckDeviceThreshold(device, mongoDbService);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi kiểm tra ngưỡng quá tải thiết bị");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }
        }

        private async Task CheckDeviceThreshold(Device device, MongoDbService mongoDbService)
        {
            try
            {
                var threshold = await mongoDbService.GetDeviceThresholdAsync(device.Id);
                
                if (threshold != null && threshold.IsEnabled)
                {
                    bool shouldTriggerAction = false;
                    
                    // Kiểm tra điều kiện dựa vào loại hành động
                    if (threshold.Action == "turnOff" && device.Consumption >= threshold.Value)
                    {
                        shouldTriggerAction = true;
                        _logger.LogInformation(
                            "Thiết bị {DeviceName} (ID: {DeviceId}) tiêu thụ {Consumption}W vượt quá ngưỡng {Threshold}W. Sẽ tắt thiết bị.",
                            device.Name, device.Id, device.Consumption, threshold.Value);
                    }
                    else if (threshold.Action == "turnOn" && device.Consumption <= threshold.Value)
                    {
                        shouldTriggerAction = true;
                        _logger.LogInformation(
                            "Thiết bị {DeviceName} (ID: {DeviceId}) tiêu thụ {Consumption}W thấp hơn ngưỡng {Threshold}W. Sẽ bật thiết bị.",
                            device.Name, device.Id, device.Consumption, threshold.Value);
                    }
                    
                    if (shouldTriggerAction)
                    {
                        string newStatus = threshold.Action == "turnOff" ? "OFF" : "ON";
                        
                        // Chỉ thay đổi trạng thái nếu khác với hiện tại
                        if (device.Status != newStatus)
                        {
                            // Cập nhật trạng thái trong DB
                            await mongoDbService.ControlDeviceAsync(device.Id, newStatus);
                            
                            // Gửi thông báo qua MQTT
                            string feedName = device.Name.ToLower().Replace(" ", "_");
                            await _mqttClientService.PublishAsync(feedName, newStatus, true, 1);
                            
                            // Tạo cảnh báo cho tất cả người dùng sở hữu thiết bị
                            foreach (var userId in device.UserIds)
                            {
                                var alert = new Alert
                                {
                                    UserId = userId,
                                    Title = "Ngưỡng quá tải kích hoạt tự động",
                                    Message = $"Thiết bị '{device.Name}' đã được {(newStatus == "ON" ? "bật" : "tắt")} " +
                                              $"tự động do {(threshold.Action == "turnOff" ? "vượt quá" : "thấp hơn")} " +
                                              $"ngưỡng điện năng {threshold.Value}W.",
                                    Severity = "warning",
                                    Date = DateTime.UtcNow
                                };
                                
                                await mongoDbService.AddAlertAsync(alert);
                                
                                // Thêm thông báo chi tiết
                                var notification = new Notification
                                {
                                    UserId = userId,
                                    Title = "Hành động tự động trên thiết bị",
                                    Message = $"Thiết bị '{device.Name}' đã {(newStatus == "ON" ? "bật" : "tắt")} " +
                                              $"tự động do {(threshold.Action == "turnOff" ? "vượt quá" : "thấp hơn")} " +
                                              $"ngưỡng {threshold.Value}W. " +
                                              $"Mức tiêu thụ: {device.Consumption}W.",
                                    Type = "alert",
                                    Read = false,
                                    Action = new NotificationAction
                                    {
                                        Type = "url",
                                        Url = $"/devices?id={device.Id}"
                                    }
                                };
                                
                                await mongoDbService.AddNotificationAsync(notification);
                            }
                            
                            _logger.LogInformation(
                                "Đã thay đổi trạng thái thiết bị {DeviceName} sang {Status} do ngưỡng quá tải",
                                device.Name, newStatus);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi kiểm tra ngưỡng quá tải cho thiết bị {DeviceId}", device.Id);
            }
        }
    }
}
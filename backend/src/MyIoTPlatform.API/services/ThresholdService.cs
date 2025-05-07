using System;
using System.Collections.Generic;
using System.Linq;
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
    public class ThresholdMonitorService : IHostedService, IDisposable
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ThresholdMonitorService> _logger;
        private Timer _timer;
        private readonly IMqttClientService _mqttClientService;

        public ThresholdMonitorService(
            IServiceProvider serviceProvider,
            ILogger<ThresholdMonitorService> logger,
            IMqttClientService mqttClientService)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _mqttClientService = mqttClientService;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Threshold Monitor Service is starting.");

            // Run the monitor every minute
            _timer = new Timer(DoWork, null, TimeSpan.Zero, TimeSpan.FromMinutes(1));

            return Task.CompletedTask;
        }

        private async void DoWork(object state)
        {
            _logger.LogInformation("Threshold Monitor Service is checking thresholds at: {time}", DateTimeOffset.Now);

            try
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var mongoDbService = scope.ServiceProvider.GetRequiredService<MongoDbService>();
                    
                    // Get all active devices
                    var allDevices = await mongoDbService.GetAllDevicesAsync();
                    
                    foreach (var device in allDevices)
                    {
                        // Only check devices that are consuming power
                        if (device.Consumption > 0)
                        {
                            // Check if device has a threshold set
                            var threshold = await mongoDbService.GetDeviceThresholdAsync(device.Id);
                            
                            if (threshold != null && threshold.IsEnabled)
                            {
                                bool shouldTrigger = false;
                                
                                // Check if threshold is exceeded based on the action type
                                if (threshold.Action == "turnOff" && device.Consumption >= threshold.Value)
                                {
                                    shouldTrigger = true;
                                    _logger.LogInformation("Device {DeviceName} consumption ({Consumption}W) exceeds threshold of {Threshold}W. Turning off.", 
                                        device.Name, device.Consumption, threshold.Value);
                                }
                                else if (threshold.Action == "turnOn" && device.Consumption <= threshold.Value)
                                {
                                    shouldTrigger = true;
                                    _logger.LogInformation("Device {DeviceName} consumption ({Consumption}W) is below threshold of {Threshold}W. Turning on.", 
                                        device.Name, device.Consumption, threshold.Value);
                                }
                                
                                if (shouldTrigger)
                                {
                                    string newStatus = threshold.Action == "turnOff" ? "OFF" : "ON";
                                    
                                    // Only change status if it's different from current status
                                    if (device.Status != newStatus)
                                    {
                                        // Update device status in database
                                        await mongoDbService.ControlDeviceAsync(device.Id, newStatus);
                                        
                                        // Also publish to MQTT feed
                                        try 
                                        {
                                            // Use the device name as feed name
                                            string feedName = device.Name.ToLower().Replace(" ", "_");
                                            await _mqttClientService.PublishAsync(feedName, newStatus, true, 1);
                                            
                                            _logger.LogInformation("Successfully published {Status} to {Feed} feed for threshold action", 
                                                newStatus, feedName);
                                                
                                            // Create alert for the device owner(s)
                                            foreach (var userId in device.UserIds)
                                            {
                                                var alert = new Alert
                                                {
                                                    UserId = userId,
                                                    Title = "Ngưỡng quá tải kích hoạt",
                                                    Message = $"Thiết bị '{device.Name}' đã được {(newStatus == "ON" ? "bật" : "tắt")} " +
                                                              $"do {(threshold.Action == "turnOff" ? "vượt quá" : "thấp hơn")} " +
                                                              $"ngưỡng điện năng {threshold.Value}W.",
                                                    Severity = "warning",
                                                    Date = DateTime.UtcNow
                                                };
                                                
                                                await mongoDbService.AddAlertAsync(alert);
                                            }
                                        }
                                        catch (Exception ex)
                                        {
                                            _logger.LogError(ex, "Error publishing MQTT message for threshold action on device {DeviceId}", device.Id);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing threshold monitor");
            }
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Threshold Monitor Service is stopping.");

            _timer?.Change(Timeout.Infinite, 0);

            return Task.CompletedTask;
        }

        public void Dispose()
        {
            _timer?.Dispose();
        }
    }
}
using Microsoft.Extensions.Logging;
using MyIoTPlatform.API.Models;
using MyIoTPlatform.Application.Interfaces.Communication;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyIoTPlatform.API.Services
{
    public class SchedulerService
    {
        private readonly MongoDbService _mongoDbService;
        private readonly ILogger<SchedulerService> _logger;
        private readonly IMqttClientService _adafruitMqttService;

        public SchedulerService(
            MongoDbService mongoDbService, 
            ILogger<SchedulerService> logger,
            IMqttClientService adafruitMqttService)
        {
            _mongoDbService = mongoDbService;
            _logger = logger;
            _adafruitMqttService = adafruitMqttService;
        }

        // Tạo hoặc cập nhật lịch trình thiết bị
        public async Task<DeviceSchedule> SetScheduleAsync(DeviceSchedule schedule)
        {
            var existingSchedule = await _mongoDbService.GetScheduleByDeviceIdAsync(schedule.DeviceId);
            
            if (existingSchedule != null)
            {
                schedule.Id = existingSchedule.Id;
                schedule.CreatedAt = existingSchedule.CreatedAt;
                schedule.UpdatedAt = DateTime.UtcNow;
                
                await _mongoDbService.UpdateScheduleAsync(schedule.Id, schedule);
                _logger.LogInformation($"Schedule updated for device '{schedule.DeviceId}'");
                return schedule;
            }
            else
            {
                schedule.Id = null; // Đảm bảo MongoDB sẽ tạo ID mới
                schedule.CreatedAt = DateTime.UtcNow;
                schedule.UpdatedAt = DateTime.UtcNow;
                
                await _mongoDbService.CreateScheduleAsync(schedule);
                _logger.LogInformation($"New schedule created for device '{schedule.DeviceId}'");
                return schedule;
            }
        }

        // Lấy lịch trình của một thiết bị
        public async Task<DeviceSchedule> GetScheduleAsync(string deviceId, string userId)
        {
            var schedule = await _mongoDbService.GetScheduleByDeviceIdAsync(deviceId);
            
            // Kiểm tra quyền truy cập
            if (schedule != null && schedule.UserId != userId)
            {
                // Kiểm tra xem người dùng có quyền truy cập vào thiết bị này không
                var hasAccess = await _mongoDbService.UserHasDeviceAccessAsync(userId, deviceId);
                if (!hasAccess)
                {
                    return null; // Người dùng không có quyền truy cập
                }
            }
            
            return schedule;
        }

        // Lấy tất cả lịch trình của người dùng
        public async Task<List<DeviceSchedule>> GetAllSchedulesAsync(string userId)
        {
            // Lấy tất cả thiết bị của người dùng
            var devices = await _mongoDbService.GetDevicesByUserIdAsync(userId);
            var deviceIds = devices.Select(d => d.Id).ToList();
            
            // Lấy lịch trình cho các thiết bị này
            var schedules = await _mongoDbService.GetSchedulesByDeviceIdsAsync(deviceIds);
            
            return schedules;
        }

        // Xóa lịch trình của một thiết bị
        public async Task<bool> DeleteScheduleAsync(string deviceId, string userId)
        {
            // Kiểm tra quyền truy cập
            var hasAccess = await _mongoDbService.UserHasDeviceAccessAsync(userId, deviceId);
            if (!hasAccess)
            {
                return false;
            }
            
            return await _mongoDbService.DeleteScheduleAsync(deviceId);
        }

        // Bật thiết bị thông qua Adafruit MQTT
        public async Task<bool> TurnOnDeviceAsync(string deviceId, string userId)
        {
            try
            {
                // Kiểm tra quyền truy cập
                var hasAccess = await _mongoDbService.UserHasDeviceAccessAsync(userId, deviceId);
                if (!hasAccess)
                {
                    return false;
                }
                
                // Cập nhật trạng thái thiết bị trong DB
                await _mongoDbService.ControlDeviceAsync(deviceId, "ON");
                
                // Lấy lịch trình để có feed Adafruit
                var schedule = await _mongoDbService.GetScheduleByDeviceIdAsync(deviceId);
                
                // Gửi lệnh đến Adafruit
                if (schedule != null && !string.IsNullOrEmpty(schedule.AdafruitFeed))
                {
                    await _adafruitMqttService.PublishAsync(schedule.AdafruitFeed, "ON");
                    _logger.LogInformation($"Published ON command to Adafruit feed '{schedule.AdafruitFeed}'");
                }
                else
                {
                    // Nếu không có feed riêng, có thể sử dụng feed mặc định theo deviceId
                    await _adafruitMqttService.PublishAsync($"device-{deviceId}", "ON");
                    _logger.LogInformation($"Published ON command to default Adafruit feed 'device-{deviceId}'");
                }
                
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error turning ON device '{deviceId}'");
                return false;
            }
        }

        // Tắt thiết bị thông qua Adafruit MQTT
        public async Task<bool> TurnOffDeviceAsync(string deviceId, string userId)
        {
            try
            {
                // Kiểm tra quyền truy cập
                var hasAccess = await _mongoDbService.UserHasDeviceAccessAsync(userId, deviceId);
                if (!hasAccess)
                {
                    return false;
                }
                
                // Cập nhật trạng thái thiết bị trong DB
                await _mongoDbService.ControlDeviceAsync(deviceId, "OFF");
                
                // Lấy lịch trình để có feed Adafruit
                var schedule = await _mongoDbService.GetScheduleByDeviceIdAsync(deviceId);
                
                // Gửi lệnh đến Adafruit
                if (schedule != null && !string.IsNullOrEmpty(schedule.AdafruitFeed))
                {
                    await _adafruitMqttService.PublishAsync(schedule.AdafruitFeed, "OFF");
                    _logger.LogInformation($"Published OFF command to Adafruit feed '{schedule.AdafruitFeed}'");
                }
                else
                {
                    // Nếu không có feed riêng, có thể sử dụng feed mặc định theo deviceId
                    await _adafruitMqttService.PublishAsync($"device-{deviceId}", "OFF");
                    _logger.LogInformation($"Published OFF command to default Adafruit feed 'device-{deviceId}'");
                }
                
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error turning OFF device '{deviceId}'");
                return false;
            }
        }
    }
}
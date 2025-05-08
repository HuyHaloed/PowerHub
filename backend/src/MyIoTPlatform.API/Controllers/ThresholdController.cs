using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyIoTPlatform.API.Models;
using MyIoTPlatform.API.Services;
using MyIoTPlatform.Application.Interfaces.Communication;

namespace MyIoTPlatform.API.Controllers
{
    [ApiController]
    [Route("api/thresholds")]
    [Authorize]
    public class ThresholdController : ControllerBase
    {
        private readonly MongoDbService _mongoDbService;
        private readonly IMqttClientService _mqttClientService;
        private readonly ILogger<ThresholdController> _logger;

        public ThresholdController(
            MongoDbService mongoDbService,
            IMqttClientService mqttClientService,
            ILogger<ThresholdController> logger)
        {
            _mongoDbService = mongoDbService;
            _mqttClientService = mqttClientService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllThresholds()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Người dùng chưa đăng nhập" });
            }

            try
            {
                // Lấy tất cả thiết bị của người dùng
                var devices = await _mongoDbService.GetDevicesByUserIdAsync(userId);
                var deviceIds = devices.Select(d => d.Id).ToList();

                var thresholds = new List<ThresholdResponse>();

                // Lấy thông tin ngưỡng quá tải cho từng thiết bị
                foreach (var deviceId in deviceIds)
                {
                    var threshold = await _mongoDbService.GetDeviceThresholdAsync(deviceId);
                    if (threshold != null)
                    {
                        var device = devices.FirstOrDefault(d => d.Id == deviceId);
                        if (device != null)
                        {
                            // Xác định feedName dựa trên loại thiết bị
                            string feedName = DetermineFeedName(device.Type);
                            
                            thresholds.Add(new ThresholdResponse
                            {
                                DeviceId = deviceId,
                                DeviceName = device.Name,
                                IsEnabled = threshold.IsEnabled,
                                Value = threshold.Value,
                                Action = threshold.Action,
                                CurrentConsumption = device.Consumption,
                                IsExceeding = IsThresholdExceeded(device.Consumption, threshold),
                                FeedName = feedName
                            });
                        }
                    }
                }

                return Ok(thresholds);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy thông tin ngưỡng quá tải");
                return StatusCode(500, new { message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        [HttpGet("device/{deviceId}")]
        public async Task<IActionResult> GetDeviceThreshold(string deviceId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Người dùng chưa đăng nhập" });
            }

            try
            {
                var device = await _mongoDbService.GetDeviceByIdAsync(deviceId);
                if (device == null || !device.UserIds.Contains(userId))
                {
                    return NotFound(new { message = "Không tìm thấy thiết bị" });
                }

                var threshold = await _mongoDbService.GetDeviceThresholdAsync(deviceId);
                
                // Xác định feedName dựa trên loại thiết bị
                string feedName = DetermineFeedName(device.Type);
                
                if (threshold == null)
                {
                    return Ok(new ThresholdResponse
                    {
                        DeviceId = deviceId,
                        DeviceName = device.Name,
                        IsEnabled = false,
                        Value = 100,
                        Action = "turnOff",
                        CurrentConsumption = device.Consumption,
                        IsExceeding = false,
                        FeedName = feedName
                    });
                }

                return Ok(new ThresholdResponse
                {
                    DeviceId = deviceId,
                    DeviceName = device.Name,
                    IsEnabled = threshold.IsEnabled,
                    Value = threshold.Value,
                    Action = threshold.Action,
                    CurrentConsumption = device.Consumption,
                    IsExceeding = IsThresholdExceeded(device.Consumption, threshold),
                    FeedName = feedName
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy thông tin ngưỡng quá tải cho thiết bị {DeviceId}", deviceId);
                return StatusCode(500, new { message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        [HttpPost("check/{deviceId}")]
        public async Task<IActionResult> CheckAndApplyThreshold(string deviceId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Người dùng chưa đăng nhập" });
            }

            try
            {
                var device = await _mongoDbService.GetDeviceByIdAsync(deviceId);
                if (device == null || !device.UserIds.Contains(userId))
                {
                    return NotFound(new { message = "Không tìm thấy thiết bị" });
                }

                var threshold = await _mongoDbService.GetDeviceThresholdAsync(deviceId);
                if (threshold == null || !threshold.IsEnabled)
                {
                    return Ok(new { applied = false, message = "Không có ngưỡng quá tải được thiết lập hoặc đã tắt" });
                }

                bool isExceeding = IsThresholdExceeded(device.Consumption, threshold);
                bool actionApplied = false;
                string newStatus = null;

                if (isExceeding)
                {
                    newStatus = threshold.Action == "turnOff" ? "OFF" : "ON";
                    
                    // Kiểm tra trạng thái hiện tại của thiết bị
                    if (device.Status != newStatus)
                    {
                        // Cập nhật trạng thái thiết bị trong cơ sở dữ liệu
                        await _mongoDbService.ControlDeviceAsync(deviceId, newStatus);
                        
                        // Xác định feed name dựa trên loại thiết bị
                        string feedName = DetermineFeedName(device.Type);
                        
                        // Thông báo qua MQTT
                        await _mqttClientService.PublishAsync(feedName, newStatus, true, 1);
                        
                        // Tạo cảnh báo cho người dùng
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
                        
                        await _mongoDbService.AddAlertAsync(alert);
                        actionApplied = true;
                    }
                }

                return Ok(new 
                { 
                    applied = actionApplied, 
                    isExceeding, 
                    newStatus,
                    threshold = new
                    {
                        value = threshold.Value,
                        action = threshold.Action,
                        feedName = DetermineFeedName(device.Type)
                    },
                    consumption = device.Consumption,
                    message = actionApplied 
                        ? $"Đã áp dụng hành động {threshold.Action} cho thiết bị" 
                        : "Không cần áp dụng hành động"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi kiểm tra và áp dụng ngưỡng quá tải cho thiết bị {DeviceId}", deviceId);
                return StatusCode(500, new { message = "Lỗi máy chủ: " + ex.Message });
            }
        }
        
        [HttpDelete("alerts/{alertId}")]
        public async Task<IActionResult> DeleteAlert(string alertId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Người dùng chưa đăng nhập" });
            }

            try
            {
                // Lấy thông tin cảnh báo
                var alert = await _mongoDbService.GetAlertByIdAsync(alertId);
                if (alert == null || alert.UserId != userId)
                {
                    return NotFound(new { message = "Không tìm thấy cảnh báo" });
                }

                // Xóa cảnh báo
                await _mongoDbService.DeleteAlertAsync(alertId);
                
                return Ok(new { success = true, message = "Đã xóa cảnh báo" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xóa cảnh báo {AlertId}", alertId);
                return StatusCode(500, new { message = "Lỗi máy chủ: " + ex.Message });
            }
        }
        
        [HttpDelete("alerts/all")]
        public async Task<IActionResult> DeleteAllAlerts()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Người dùng chưa đăng nhập" });
            }

            try
            {
                // Xóa tất cả cảnh báo của người dùng
                await _mongoDbService.DeleteAllUserAlertsAsync(userId);
                
                return Ok(new { success = true, message = "Đã xóa tất cả cảnh báo" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xóa tất cả cảnh báo của người dùng {UserId}", userId);
                return StatusCode(500, new { message = "Lỗi máy chủ: " + ex.Message });
            }
        }

        // Helper method to check if a device's consumption exceeds its threshold
        private bool IsThresholdExceeded(double consumption, DeviceThreshold threshold)
        {
            if (!threshold.IsEnabled)
                return false;

            if (threshold.Action == "turnOff")
            {
                return consumption >= threshold.Value;
            }
            else // "turnOn"
            {
                return consumption <= threshold.Value;
            }
        }
        
        // Helper method to determine feedName based on device type
        private string DetermineFeedName(string deviceType)
        {
            string type = deviceType?.ToLower() ?? "";
            
            if (type.Contains("light"))
            {
                return "powerlight";
            }
            else if (type.Contains("fan"))
            {
                return "powerfan";
            }
            else if (type.Contains("air") || type.Contains("ac"))
            {
                return "powerac";
            }
            else if (type.Contains("tv"))
            {
                return "powertv";
            }
            else
            {
                return "powerlight"; // Mặc định nếu không xác định được
            }
        }
    }

    public class ThresholdResponse
    {
        public string DeviceId { get; set; }
        public string DeviceName { get; set; }
        public bool IsEnabled { get; set; }
        public int Value { get; set; }
        public string Action { get; set; }
        public double CurrentConsumption { get; set; }
        public bool IsExceeding { get; set; }
        public string FeedName { get; set; }
    }
    
    public class ThresholdUpdateRequest
    {
        public bool IsEnabled { get; set; }
        public int Value { get; set; }
        public string Action { get; set; }
    }
}
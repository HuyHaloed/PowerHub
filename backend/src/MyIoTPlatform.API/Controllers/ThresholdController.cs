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
                            thresholds.Add(new ThresholdResponse
                            {
                                DeviceId = deviceId,
                                DeviceName = device.Name,
                                IsEnabled = threshold.IsEnabled,
                                Value = threshold.Value,
                                Action = threshold.Action,
                                CurrentConsumption = device.Consumption,
                                IsExceeding = IsThresholdExceeded(device.Consumption, threshold)
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
                        IsExceeding = false
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
                    IsExceeding = IsThresholdExceeded(device.Consumption, threshold)
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

                if (isExceeding)
                {
                    string newStatus = threshold.Action == "turnOff" ? "OFF" : "ON";
                    
                    // Kiểm tra trạng thái hiện tại của thiết bị
                    if (device.Status != newStatus)
                    {
                        // Cập nhật trạng thái thiết bị trong cơ sở dữ liệu
                        await _mongoDbService.ControlDeviceAsync(deviceId, newStatus);
                        
                        // Thông báo qua MQTT
                        string feedName = device.Name.ToLower().Replace(" ", "_");
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
                    threshold = new
                    {
                        value = threshold.Value,
                        action = threshold.Action
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
    }
}
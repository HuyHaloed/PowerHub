
using System.Security.Claims;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyIoTPlatform.API.Models;
using MyIoTPlatform.API.Services;

namespace MyIoTPlatform.API.Controllers
{
    [ApiController]
    [Route("api/devices")]
    [Authorize]
    public class DevicesController : ControllerBase
    {
        private readonly MongoDbService _mongoDbService;

        public DevicesController(MongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllDevices(string status = null, string location = null, string type = null, string search = null)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var devices = await _mongoDbService.GetDevicesByUserIdAsync(userId, status, location, type, search);
            return Ok(devices);
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveDevices()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var devices = await _mongoDbService.GetActiveDevicesByUserIdAsync(userId);
            return Ok(devices);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDeviceDetails(string id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var device = await _mongoDbService.GetDeviceByIdAsync(id);
            if (device == null || !device.UserIds.Contains(userId))
                return NotFound($"Device with ID {id} not found.");

            return Ok(device);
        }
        // Add to DevicesController class

        [HttpGet("{id}/threshold")]
        public async Task<IActionResult> GetDeviceThreshold(string id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var device = await _mongoDbService.GetDeviceByIdAsync(id);
            if (device == null || !device.UserIds.Contains(userId))
                return NotFound($"Device with ID {id} not found.");

            var threshold = await _mongoDbService.GetDeviceThresholdAsync(id);
            if (threshold == null)
            {
                return Ok(new
                {
                    isEnabled = false,
                    value = 100,
                    action = "turnOff"
                });
            }

            return Ok(new
            {
                isEnabled = threshold.IsEnabled,
                value = threshold.Value,
                action = threshold.Action
            });
        }

        [HttpPost("{id}/threshold")]
        public async Task<IActionResult> SetDeviceThreshold(string id, [FromBody] ThresholdRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var device = await _mongoDbService.GetDeviceByIdAsync(id);
            if (device == null || !device.UserIds.Contains(userId))
                return NotFound($"Device with ID {id} not found.");

            var threshold = new DeviceThreshold
            {
                DeviceId = id,
                UserId = userId,
                IsEnabled = request.IsEnabled,
                Value = request.Value,
                Action = request.Action
            };

            await _mongoDbService.SetDeviceThresholdAsync(threshold);

            return Ok(new
            {
                message = "Threshold settings saved successfully",
                threshold = new
                {
                    isEnabled = threshold.IsEnabled,
                    value = threshold.Value,
                    action = threshold.Action
                }
            });
        }

        [HttpPut("{id}/control")]
        public async Task<IActionResult> ControlDevice(string id, [FromBody] ControlDeviceRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var device = await _mongoDbService.GetDeviceByIdAsync(id);
            if (device == null || !device.UserIds.Contains(userId))
                return NotFound($"Device with ID {id} not found.");

            var updatedDevice = await _mongoDbService.ControlDeviceAsync(id, request.Status);
            
            return Ok(new
            {
                id = updatedDevice.Id,
                name = updatedDevice.Name,
                status = updatedDevice.Status,
                message = "Device status updated."
            });
        }

        [HttpPut("control-by-name")]
        public async Task<IActionResult> ControlDeviceByName([FromBody] ControlDeviceByNameRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Tìm thiết bị theo tên và userId
            var device = await _mongoDbService.GetDeviceByNameAndUserIdAsync(request.Name, userId);
            if (device == null)
                return NotFound($"Không tìm thấy thiết bị có tên '{request.Name}'.");

            // Cập nhật trạng thái thiết bị
            var updatedDevice = await _mongoDbService.ControlDeviceAsync(device.Id, request.Status);
            
            return Ok(new
            {
                id = updatedDevice.Id,
                name = updatedDevice.Name,
                status = updatedDevice.Status,
                message = "Trạng thái thiết bị đã được cập nhật."
            });
        }


        [HttpPost]
        public async Task<IActionResult> AddNewDevice([FromBody] AddDeviceRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var device = new Device
            {
                Name = request.Name,
                Type = request.Type,
                Location = request.Location,
                Status = "OFF",
                Consumption = 0,
                LastUpdated = DateTime.UtcNow,
                UserIds = new List<string> { userId },
                Properties = request.Properties != null ? new DeviceProperties
                {
                    Brand = request.Properties.Brand,
                    Model = request.Properties.Model,
                    SerialNumber = request.Properties.SerialNumber,
                    PowerRating = request.Properties.PowerRating,
                    InstallDate = DateTime.UtcNow.ToString("yyyy-MM-dd")
                } : new DeviceProperties()
            };

            await _mongoDbService.CreateDeviceAsync(device);

            return CreatedAtAction(nameof(GetDeviceDetails), new { id = device.Id }, new
            {
                id = device.Id,
                name = device.Name,
                type = device.Type,
                location = device.Location,
                status = device.Status,
                message = "Device added successfully."
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDevice(string id, [FromBody] UpdateDeviceRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var device = await _mongoDbService.GetDeviceByIdAsync(id);
            if (device == null || !device.UserIds.Contains(userId))
                return NotFound($"Device with ID {id} not found.");

            device.Name = request.Name;
            device.Type = request.Type;
            device.Location = request.Location;

            if (request.Properties != null)
            {
                device.Properties = new DeviceProperties
                {
                    Brand = request.Properties.Brand,
                    Model = request.Properties.Model,
                    SerialNumber = request.Properties.SerialNumber,
                    PowerRating = request.Properties.PowerRating,
                    InstallDate = device.Properties?.InstallDate ?? DateTime.UtcNow.ToString("yyyy-MM-dd")
                };
            }

            await _mongoDbService.UpdateDeviceAsync(id, device);

            return Ok(new
            {
                id = device.Id,
                name = device.Name,
                message = "Device updated successfully."
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDevice(string id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var device = await _mongoDbService.GetDeviceByIdAsync(id);
            if (device == null || !device.UserIds.Contains(userId))
                return NotFound($"Device with ID {id} not found.");

            await _mongoDbService.DeleteDeviceAsync(id);

            return Ok(new { message = "Device deleted successfully." });
        }
        [HttpPost("share")]
        public async Task<IActionResult> ShareDevice([FromBody] ShareDeviceRequest request)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var userToShareWith = await _mongoDbService.GetUserByEmailAsync(request.EmailToShare);
            if (userToShareWith == null)
            {
                return BadRequest(new { message = "Người dùng không tồn tại" });
            }

            var device = await _mongoDbService.GetDeviceByIdAsync(request.DeviceId);
            if (device == null)
            {
                return NotFound(new { message = "Không tìm thấy thiết bị" });
            }

            if (!device.UserIds.Contains(currentUserId))
            {
                return new ForbidResult();
            }

            if (device.UserIds.Contains(userToShareWith.Id))
            {
                return BadRequest(new { message = "Thiết bị đã được chia sẻ với người dùng này" });
            }

            device.UserIds.Add(userToShareWith.Id);
            await _mongoDbService.UpdateDeviceAsync(device.Id, device);

            var notification = new Notification
            {
                UserId = userToShareWith.Id,
                Title = "Chia sẻ thiết bị",
                Message = $"Bạn đã được chia sẻ thiết bị '{device.Name}' từ người dùng khác",
                Type = "info",
                Action = new NotificationAction
                {
                    Type = "url",
                    Url = $"/devices/{device.Id}"
                }
            };
            await _mongoDbService.AddNotificationAsync(notification);

            return Ok(new { 
                message = "Chia sẻ thiết bị thành công", 
                deviceId = device.Id,
                sharedWithUserId = userToShareWith.Id 
            });
        }
        [HttpGet("device-statistics")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<DeviceStatisticsDto>> GetDeviceStatistics()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var deviceStatistics = await _mongoDbService.GetDeviceStatisticsAsync(userId);
            return Ok(deviceStatistics);
        }
    }
}
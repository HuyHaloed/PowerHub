using Microsoft.AspNetCore.Mvc;
using MyIoTPlatform.API.Models;
using MyIoTPlatform.API.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
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
            var devices = await _mongoDbService.GetAllDevicesAsync(status, location, type, search);
            return Ok(devices);
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveDevices()
        {
            var devices = await _mongoDbService.GetActiveDevicesAsync();
            return Ok(devices);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDeviceDetails(string id)
        {
            var device = await _mongoDbService.GetDeviceByIdAsync(id);
            if (device == null)
                return NotFound($"Device with ID {id} not found.");

            return Ok(device);
        }

        [HttpPut("{id}/control")]
        public async Task<IActionResult> ControlDevice(string id, [FromBody] ControlDeviceRequest request)
        {
            var device = await _mongoDbService.GetDeviceByIdAsync(id);
            if (device == null)
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

        [HttpPost]
        public async Task<IActionResult> AddNewDevice([FromBody] AddDeviceRequest request)
        {
            // Lấy ID của người dùng hiện tại từ token
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            var device = new Device
            {
                Name = request.Name,
                Type = request.Type,
                Location = request.Location,
                Status = "off",
                Consumption = 0,
                LastUpdated = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                UserId = userId, // Thêm userId vào thiết bị
                Properties = request.Properties != null ? new DeviceProperties
                {
                    Brand = request.Properties.Brand,
                    Model = request.Properties.Model,
                    SerialNumber = request.Properties.SerialNumber,
                    PowerRating = request.Properties.PowerRating,
                    InstallDate = DateTime.UtcNow.ToString("yyyy-MM-dd")
                } : null
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
            var device = await _mongoDbService.GetDeviceByIdAsync(id);
            if (device == null)
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
            var device = await _mongoDbService.GetDeviceByIdAsync(id);
            if (device == null)
                return NotFound($"Device with ID {id} not found.");

            await _mongoDbService.DeleteDeviceAsync(id);

            return Ok(new { message = "Device deleted successfully." });
        }
    }
}
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyIoTPlatform.API.Models;
using MyIoTPlatform.API.Services;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;

namespace MyIoTPlatform.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EnvironmentController : ControllerBase
    {
        private readonly MongoDbService _mongoDbService;

        public EnvironmentController(MongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
        }

        private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<EnvironmentDataResponse>>> GetEnvironmentData(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string location = null)
        {
            var userId = GetUserId();
            
            // Check if user has subscription for environment data
            var hasSubscription = await _mongoDbService.HasEnvironmentDataSubscriptionAsync(userId);
            if (!hasSubscription)
            {
                return Ok(new { hasSubscription = false, data = new List<EnvironmentDataResponse>() });
            }
            
            var data = await _mongoDbService.GetEnvironmentDataForUserAsync(userId, startDate, endDate, null);
            
            // Lọc theo vị trí nếu được chỉ định
            if (!string.IsNullOrEmpty(location))
            {
                data = data.Where(d => d.Location.Equals(location, StringComparison.OrdinalIgnoreCase)).ToList();
            }
            
            var response = data.Select(d => new EnvironmentDataResponse
            {
                Id = d.Id,
                // DeviceId = d.DeviceId,
                // DeviceName = d.DeviceName,
                Temperature = d.Temperature,
                Humidity = d.Humidity,
                Timestamp = d.Timestamp,
                Location = d.Location
            }).ToList();
            
            return Ok(new { hasSubscription = true, data = response });
        }

        [HttpGet("latest")]
        public async Task<ActionResult<EnvironmentDataResponse>> GetLatestEnvironmentData(
            [FromQuery] string location = null)
        {
            var userId = GetUserId();
            
            // Check if user has subscription for environment data
            var hasSubscription = await _mongoDbService.HasEnvironmentDataSubscriptionAsync(userId);
            if (!hasSubscription)
            {
                return Ok(new { hasSubscription = false });
            }
            
            var data = await _mongoDbService.GetLatestEnvironmentDataForUserAsync(userId, null);
            
            // Lọc theo vị trí nếu được chỉ định
            if (!string.IsNullOrEmpty(location) && data != null && !data.Location.Equals(location, StringComparison.OrdinalIgnoreCase))
            {
                // Tìm dữ liệu mới nhất cho vị trí cụ thể
                var allData = await _mongoDbService.GetEnvironmentDataForUserAsync(userId);
                data = allData.Where(d => d.Location.Equals(location, StringComparison.OrdinalIgnoreCase))
                             .OrderByDescending(d => d.Timestamp)
                             .FirstOrDefault();
            }
            
            if (data == null)
            {
                return Ok(new { hasSubscription = true, hasData = false });
            }
            
            var response = new EnvironmentDataResponse
            {
                Id = data.Id,
                // DeviceId = data.DeviceId,
                // DeviceName = data.DeviceName,
                Temperature = data.Temperature,
                Humidity = data.Humidity,
                Timestamp = data.Timestamp,
                Location = data.Location
            };
            
            return Ok(new { hasSubscription = true, hasData = true, data = response });
        }

        [HttpGet("stats")]
        public async Task<ActionResult<EnvironmentStatsDto>> GetEnvironmentStats(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string location = null)
        {
            var userId = GetUserId();
            
            // Check if user has subscription for environment data
            var hasSubscription = await _mongoDbService.HasEnvironmentDataSubscriptionAsync(userId);
            if (!hasSubscription)
            {
                return Ok(new { hasSubscription = false });
            }
            
            // Lấy dữ liệu
            var allData = await _mongoDbService.GetEnvironmentDataForUserAsync(userId, startDate, endDate, null);
            
            // Lọc theo vị trí nếu được chỉ định
            if (!string.IsNullOrEmpty(location))
            {
                allData = allData.Where(d => d.Location.Equals(location, StringComparison.OrdinalIgnoreCase)).ToList();
            }
            
            if (allData.Count == 0)
            {
                return Ok(new { hasSubscription = true, hasData = false });
            }
            
            // Tính toán thống kê
            var latestData = allData.OrderByDescending(d => d.Timestamp).First();
            var stats = new EnvironmentStatsDto
            {
                CurrentTemperature = latestData.Temperature,
                CurrentHumidity = latestData.Humidity,
                AvgTemperature = Math.Round(allData.Average(d => d.Temperature), 1),
                AvgHumidity = Math.Round(allData.Average(d => d.Humidity), 1),
                MaxTemperature = Math.Round(allData.Max(d => d.Temperature), 1),
                MinTemperature = Math.Round(allData.Min(d => d.Temperature), 1),
                MaxHumidity = Math.Round(allData.Max(d => d.Humidity), 1),
                MinHumidity = Math.Round(allData.Min(d => d.Humidity), 1),
                LastUpdated = latestData.Timestamp,
                Location = latestData.Location,
                HasData = true
            };
            
            return Ok(new { hasSubscription = true, hasData = true, data = stats });
        }

        [HttpPost]
        public async Task<ActionResult<EnvironmentDataResponse>> AddEnvironmentData(
            [FromBody] EnvironmentDataRequest request)
        {
            var userId = GetUserId();
            
            // // Kiểm tra thiết bị nếu được chỉ định
            // if (!string.IsNullOrEmpty(request.DeviceId))
            // {
            //     var device = await _mongoDbService.GetDeviceByIdAsync(request.DeviceId);
            //     if (device == null || !device.UserIds.Contains(userId))
            //     {
            //         return NotFound("Device not found or not owned by the user");
            //     }
            // }

            // Check if user has subscription for environment data
            var hasSubscription = await _mongoDbService.HasEnvironmentDataSubscriptionAsync(userId);
            if (!hasSubscription)
            {
                return BadRequest(new { success = false, message = "User does not have an environment data subscription" });
            }
            
            // Tạo bản ghi mới
            var data = new EnvironmentData
            {
                UserId = userId,
                // DeviceId = request.DeviceId, // Có thể null
                // DeviceName = null, // Không lưu tên thiết bị
                Temperature = request.Temperature,
                Humidity = request.Humidity,
                Timestamp = DateTime.UtcNow,
                Location = string.IsNullOrEmpty(request.Location) ? "Phòng khách" : request.Location
            };
            
            await _mongoDbService.AddEnvironmentDataAsync(data);
            
            var response = new EnvironmentDataResponse
            {
                Id = data.Id,
                // DeviceId = data.DeviceId,
                // DeviceName = data.DeviceName,
                Temperature = data.Temperature,
                Humidity = data.Humidity,
                Timestamp = data.Timestamp,
                Location = data.Location
            };
            
            return Ok(new { success = true, data = response });
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteEnvironmentData(string id)
        {
            var userId = GetUserId();
            
            var deleted = await _mongoDbService.DeleteEnvironmentDataAsync(id, userId);
            
            if (!deleted)
            {
                return NotFound(new { success = false, message = "Environment data not found or not owned by the user" });
            }
            
            return Ok(new { success = true });
        }
        
        [HttpGet("locations")]
        public async Task<ActionResult<IEnumerable<string>>> GetLocationsList()
        {
            var userId = GetUserId();
            
            // Check if user has subscription for environment data
            var hasSubscription = await _mongoDbService.HasEnvironmentDataSubscriptionAsync(userId);
            if (!hasSubscription)
            {
                return Ok(new { hasSubscription = false, data = new List<string>() });
            }
            
            var data = await _mongoDbService.GetEnvironmentDataForUserAsync(userId);
            var locations = data.Select(d => d.Location)
                              .Distinct()
                              .OrderBy(l => l)
                              .ToList();
            
            return Ok(new { hasSubscription = true, data = locations });
        }
    }
}
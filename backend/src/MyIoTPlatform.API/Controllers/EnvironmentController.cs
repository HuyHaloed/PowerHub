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
            [FromQuery] string deviceId = null)
        {
            var userId = GetUserId();
            
            // Check if user has subscription for environment data
            var hasSubscription = await _mongoDbService.HasEnvironmentDataSubscriptionAsync(userId);
            if (!hasSubscription)
            {
                return Ok(new List<EnvironmentDataResponse>());
            }
            
            var data = await _mongoDbService.GetEnvironmentDataForUserAsync(userId, startDate, endDate, deviceId);
            
            var response = data.Select(d => new EnvironmentDataResponse
            {
                Id = d.Id,
                DeviceId = d.DeviceId,
                DeviceName = d.DeviceName,
                Temperature = d.Temperature,
                Humidity = d.Humidity,
                Timestamp = d.Timestamp,
                Location = d.Location
            }).ToList();
            
            return Ok(response);
        }

        [HttpGet("latest")]
        public async Task<ActionResult<EnvironmentDataResponse>> GetLatestEnvironmentData(
            [FromQuery] string deviceId = null)
        {
            var userId = GetUserId();
            
            // Check if user has subscription for environment data
            var hasSubscription = await _mongoDbService.HasEnvironmentDataSubscriptionAsync(userId);
            if (!hasSubscription)
            {
                return Ok(new { hasSubscription = false });
            }
            
            var data = await _mongoDbService.GetLatestEnvironmentDataForUserAsync(userId, deviceId);
            
            if (data == null)
            {
                return Ok(new { hasSubscription = true, hasData = false });
            }
            
            var response = new EnvironmentDataResponse
            {
                Id = data.Id,
                DeviceId = data.DeviceId,
                DeviceName = data.DeviceName,
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
            [FromQuery] DateTime? endDate = null)
        {
            var userId = GetUserId();
            
            // Check if user has subscription for environment data
            var hasSubscription = await _mongoDbService.HasEnvironmentDataSubscriptionAsync(userId);
            if (!hasSubscription)
            {
                return Ok(new { hasSubscription = false });
            }
            
            var stats = await _mongoDbService.GetEnvironmentStatsForUserAsync(userId, startDate, endDate);
            
            return Ok(new { hasSubscription = true, data = stats });
        }

        [HttpPost]
        public async Task<ActionResult<EnvironmentDataResponse>> AddEnvironmentData(
            [FromBody] EnvironmentDataRequest request)
        {
            var userId = GetUserId();
            
            // Verify that the device belongs to the user
            var device = await _mongoDbService.GetDeviceByIdAsync(request.DeviceId);
            if (device == null || !device.UserIds.Contains(userId))
            {
                return NotFound("Device not found or not owned by the user");
            }

            // Check if user has subscription for environment data
            var hasSubscription = await _mongoDbService.HasEnvironmentDataSubscriptionAsync(userId);
            if (!hasSubscription)
            {
                return BadRequest("User does not have an environment data subscription");
            }
            
            var data = new EnvironmentData
            {
                UserId = userId,
                DeviceId = request.DeviceId,
                DeviceName = device.Name,
                Temperature = request.Temperature,
                Humidity = request.Humidity,
                Timestamp = DateTime.UtcNow,
                Location = string.IsNullOrEmpty(request.Location) ? device.Location : request.Location
            };
            
            await _mongoDbService.AddEnvironmentDataAsync(data);
            
            var response = new EnvironmentDataResponse
            {
                Id = data.Id,
                DeviceId = data.DeviceId,
                DeviceName = data.DeviceName,
                Temperature = data.Temperature,
                Humidity = data.Humidity,
                Timestamp = data.Timestamp,
                Location = data.Location
            };
            
            return Ok(response);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteEnvironmentData(string id)
        {
            var userId = GetUserId();
            
            var deleted = await _mongoDbService.DeleteEnvironmentDataAsync(id, userId);
            
            if (!deleted)
            {
                return NotFound("Environment data not found or not owned by the user");
            }
            
            return NoContent();
        }
    }
}
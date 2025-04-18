using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyIoTPlatform.API.Services;

namespace MyIoTPlatform.API.Controllers
{
    [ApiController]
    [Route("api/energy")]
    [Authorize]
    public class EnergyController : ControllerBase
    {
        private readonly EnergyService _energyService;
        
        public EnergyController(EnergyService energyService)
        {
            _energyService = energyService;
        }

        [HttpGet("consumption")]
        public async Task<IActionResult> GetEnergyConsumption(string timeRange, string? startDate = null, string? endDate = null)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }
            
            DateTime? startDateTime = null;
            if (!string.IsNullOrEmpty(startDate))
            {
                if (DateTime.TryParse(startDate, out var parsedStartDate))
                    startDateTime = parsedStartDate;
            }
            
            DateTime? endDateTime = null;
            if (!string.IsNullOrEmpty(endDate))
            {
                if (DateTime.TryParse(endDate, out var parsedEndDate))
                    endDateTime = parsedEndDate;
            }
            
            var consumptionData = await _energyService.GetEnergyConsumptionAsync(userId, timeRange, startDateTime, endDateTime);
            
            return Ok(consumptionData);
        }

        [HttpGet("distribution")]
        public async Task<IActionResult> GetEnergyDistribution()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }
            
            var distribution = await _energyService.GetEnergyDistributionAsync(userId, DateTime.UtcNow);
            
            return Ok(distribution);
        }

        [HttpGet("predictions")]
        public async Task<IActionResult> GetEnergyPredictions(string timeRange, int periods)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }
            
            var predictions = await _energyService.GetEnergyPredictionsAsync(userId, timeRange, periods);
            
            return Ok(predictions);
        }

        [HttpGet("compare")]
        public async Task<IActionResult> CompareEnergyUsage(string timeRange, string? startDate, string? endDate)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }
            
            DateTime? startDateTime = null;
            if (!string.IsNullOrEmpty(startDate))
            {
                if (DateTime.TryParse(startDate, out var parsedStartDate))
                    startDateTime = parsedStartDate;
            }
            
            DateTime? endDateTime = null;
            if (!string.IsNullOrEmpty(endDate))
            {
                if (DateTime.TryParse(endDate, out var parsedEndDate))
                    endDateTime = parsedEndDate;
            }
            
            var (currentPeriod, previousPeriod, change) = await _energyService.CompareEnergyUsageAsync(userId, timeRange, startDateTime, endDateTime);
            
            return Ok(new
            {
                currentPeriod,
                previousPeriod,
                comparison = new
                {
                    change,
                    changeType = change >= 0 ? "increase" : "decrease"
                }
            });
        }
    }
}
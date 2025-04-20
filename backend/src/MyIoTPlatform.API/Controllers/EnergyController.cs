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
            
            // Special handling for day view with hourly data
            if (timeRange.ToLower() == "day" && !string.IsNullOrEmpty(startDate))
            {
                if (DateTime.TryParse(startDate, out var parsedDate))
                {
                    // Use the special hourly method for day view
                    var hourlyData = await _energyService.GetHourlyEnergyForDayAsync(
                        userId, 
                        DateTime.SpecifyKind(parsedDate.Date, DateTimeKind.Utc)
                    );
                    
                    return Ok(hourlyData);
                }
            }
            
            // Regular handling for other time ranges
            DateTime? startDateTime = null;
            DateTime? endDateTime = null;
            
            if (!string.IsNullOrEmpty(startDate))
            {
                if (DateTime.TryParse(startDate, out var parsedStartDate))
                {
                    startDateTime = DateTime.SpecifyKind(parsedStartDate, DateTimeKind.Utc);
                }
            }
            
            if (!string.IsNullOrEmpty(endDate))
            {
                if (DateTime.TryParse(endDate, out var parsedEndDate))
                {
                    endDateTime = DateTime.SpecifyKind(parsedEndDate, DateTimeKind.Utc);
                }
            }
            
            // Now using distribution data to calculate consumption
            var consumptionData = await _energyService.GetConsumptionFromDistributionAsync(userId, timeRange, startDateTime, endDateTime);
            
            return Ok(consumptionData);
        }

        [HttpGet("distribution")]
        public async Task<IActionResult> GetEnergyDistribution(string? date = null)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }
            
            DateTime targetDate = DateTime.UtcNow;
            
            if (!string.IsNullOrEmpty(date))
            {
                if (DateTime.TryParse(date, out var parsedDate))
                {
                    targetDate = DateTime.SpecifyKind(parsedDate, DateTimeKind.Utc);
                }
            }
            
            var distribution = await _energyService.GetEnergyDistributionAsync(userId, targetDate);
            
            return Ok(distribution);
        }

        [HttpGet("predictions")]
        public async Task<IActionResult> GetEnergyPredictions(string timeRange, int periods = 7)
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
        public async Task<IActionResult> CompareEnergyUsage(string timeRange, string? startDate = null, string? endDate = null)
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
                    startDateTime = DateTime.SpecifyKind(parsedStartDate, DateTimeKind.Utc);
            }
            
            DateTime? endDateTime = null;
            if (!string.IsNullOrEmpty(endDate))
            {
                if (DateTime.TryParse(endDate, out var parsedEndDate))
                    endDateTime = DateTime.SpecifyKind(parsedEndDate, DateTimeKind.Utc);
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
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyIoTPlatform.API.Models;
using MyIoTPlatform.API.Services;

namespace MyIoTPlatform.API.Controllers
{
    [ApiController]
    [Route("api/analytics")]
    [Authorize]
    public class AnalyticsController : ControllerBase
    {
        private readonly EnergyService _energyService;
        private readonly MongoDbService _mongoDbService;
        
        public AnalyticsController(EnergyService energyService, MongoDbService mongoDbService)
        {
            _energyService = energyService;
            _mongoDbService = mongoDbService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAnalyticsData(string? startDate = null, string? endDate = null, string timeRange = "day")
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
            if (!startDateTime.HasValue)
            {
                switch (timeRange.ToLower())
                {
                    case "day":
                        startDateTime = DateTime.UtcNow.Date;
                        break;
                    case "week":
                        startDateTime = DateTime.UtcNow.AddDays(-(int)DateTime.UtcNow.DayOfWeek).Date;
                        break;
                    case "month":
                        startDateTime = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
                        break;
                    case "year":
                        startDateTime = new DateTime(DateTime.UtcNow.Year, 1, 1);
                        break;
                    default:
                        startDateTime = DateTime.UtcNow.Date;
                        break;
                }
            }
            
            if (!endDateTime.HasValue)
            {
                switch (timeRange.ToLower())
                {
                    case "day":
                        endDateTime = startDateTime.Value.AddDays(1).AddTicks(-1);
                        break;
                    case "week":
                        endDateTime = startDateTime.Value.AddDays(7).AddTicks(-1);
                        break;
                    case "month":
                        endDateTime = startDateTime.Value.AddMonths(1).AddTicks(-1);
                        break;
                    case "year":
                        endDateTime = startDateTime.Value.AddYears(1).AddTicks(-1);
                        break;
                    default:
                        endDateTime = startDateTime.Value.AddDays(1).AddTicks(-1);
                        break;
                }
            }
            
            var consumptionData = await _energyService.GetEnergyConsumptionAsync(userId, timeRange, startDateTime, endDateTime);
            
            if (consumptionData.Count == 0)
            {
                return Ok(new
                {
                    totalConsumption = 0,
                    avgConsumption = 0,
                    peakConsumption = 0,
                    lowestConsumption = 0,
                    comparisonValue = 0,
                    estimatedCost = 0,
                    costPerKwh = 0.15,
                    data = new List<object>()
                });
            }
            
            var totalConsumption = consumptionData.Sum(c => c.Value);
            var avgConsumption = totalConsumption / consumptionData.Count;
            var peakConsumption = consumptionData.Max(c => c.Value);
            var lowestConsumption = consumptionData.Min(c => c.Value);
            var previousStartDate = startDateTime.Value.AddDays(-(endDateTime.Value - startDateTime.Value).Days);
            var previousEndDate = startDateTime.Value.AddTicks(-1);
            
            var previousData = await _energyService.GetEnergyConsumptionAsync(userId, timeRange, previousStartDate, previousEndDate);
            
            double comparisonValue = 0;
            if (previousData.Count > 0)
            {
                var previousTotal = previousData.Sum(c => c.Value);
                if (previousTotal > 0)
                {
                    comparisonValue = Math.Round(((totalConsumption - previousTotal) / previousTotal) * 100, 1);
                }
            }
            var costPerKwh = 0.15;
            var estimatedCost = totalConsumption * costPerKwh;
            
            return Ok(new
            {
                totalConsumption,
                avgConsumption,
                peakConsumption,
                lowestConsumption,
                comparisonValue,
                estimatedCost,
                costPerKwh,
                data = consumptionData
            });
        }

        [HttpGet("devices")]
        public async Task<IActionResult> GetDeviceAnalytics(string deviceId = null, string? startDate = null, string? endDate = null, string timeRange = "day")
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
            if (!startDateTime.HasValue)
            {
                switch (timeRange.ToLower())
                {
                    case "day":
                        startDateTime = DateTime.UtcNow.Date;
                        break;
                    case "week":
                        startDateTime = DateTime.UtcNow.AddDays(-(int)DateTime.UtcNow.DayOfWeek).Date;
                        break;
                    case "month":
                        startDateTime = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
                        break;
                    case "year":
                        startDateTime = new DateTime(DateTime.UtcNow.Year, 1, 1);
                        break;
                    default:
                        startDateTime = DateTime.UtcNow.Date;
                        break;
                }
            }
            
            if (!endDateTime.HasValue)
            {
                endDateTime = DateTime.UtcNow;
            }
            
            List<Device> devices;
            if (!string.IsNullOrEmpty(deviceId))
            {
                var device = await _mongoDbService.GetDeviceByIdAsync(deviceId);
                if (device == null || !device.UserIds.Contains(userId))
                    return NotFound(new { message = "Device not found" });
                
                devices = new List<Device> { device };
            }
            else
            {
                devices = await _mongoDbService.GetDevicesByUserIdAsync(userId);
            }
            
            var result = new List<object>();
            
            foreach (var device in devices)
            {
                var consumptionData = await _energyService.GetEnergyConsumptionByDeviceAsync(userId, device.Id, timeRange, startDateTime, endDateTime);
                
                if (consumptionData.Count == 0)
                {
                    result.Add(new
                    {
                        deviceId = device.Id,
                        deviceName = device.Name,
                        totalConsumption = 0,
                        avgConsumption = 0,
                        peakConsumption = 0,
                        onDuration = 0,
                        costEstimate = 0,
                        data = new List<object>()
                    });
                    continue;
                }
                
                var totalConsumption = consumptionData.Sum(c => c.Value);
                var avgConsumption = totalConsumption / consumptionData.Count;
                var peakConsumption = consumptionData.Max(c => c.Value);
                
                // Estimate on duration in hours
                var onDuration = device.History
                    .Where(h => h.Status == "on" && h.Timestamp >= startDateTime && h.Timestamp <= endDateTime)
                    .Sum(h => h.Consumption > 0 ? 1 : 0); // Simplified estimate - 1 hour for each consumption data point
                
                // Calculate estimated cost
                var costPerKwh = 0.15; // Default value - could be retrieved from user preferences
                var costEstimate = totalConsumption * costPerKwh;
                
                result.Add(new
                {
                    deviceId = device.Id,
                    deviceName = device.Name,
                    totalConsumption,
                    avgConsumption,
                    peakConsumption,
                    onDuration,
                    costEstimate,
                    data = consumptionData
                });
            }
            
            return Ok(result);
        }

        [HttpGet("export")]
        public IActionResult ExportData(string format, string? startDate = null, string? endDate = null, string type = "consumption")
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }
            
            // In a real implementation, this would generate and return a file
            // For demonstration purposes, we return a placeholder message
            
            return Ok(new 
            { 
                message = $"Exporting {type} data in {format} format...",
                format,
                startDate,
                endDate,
                type
            });
        }
    }
}
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyIoTPlatform.API.Models;
using MyIoTPlatform.API.Services;

namespace MyIoTPlatform.API.Controllers
{
    [ApiController]
    [Route("api/device-energy")]
    [Authorize]
    public class DeviceEnergyController : ControllerBase
    {
        private readonly MongoDbService _mongoDbService;
        private readonly EnergyService _energyService;
        
        public DeviceEnergyController(MongoDbService mongoDbService, EnergyService energyService)
        {
            _mongoDbService = mongoDbService;
            _energyService = energyService;
        }

        [HttpGet("{deviceId}")]
        public async Task<IActionResult> GetDeviceEnergyData(string deviceId, string timeRange = "day", string? startDate = null, string? endDate = null)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }
            var device = await _mongoDbService.GetDeviceByIdAsync(deviceId);
            if (device == null || !device.UserIds.Contains(userId))
            {
                return NotFound(new { message = "Device not found or you don't have access to it" });
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
            var consumptionData = await _energyService.GetEnergyConsumptionByDeviceAsync(userId, deviceId, timeRange, startDateTime, endDateTime);
            
            if (consumptionData.Count == 0)
            {
                return Ok(new
                {
                    deviceId,
                    deviceName = device.Name,
                    totalConsumption = 0,
                    avgConsumption = 0,
                    peakConsumption = 0,
                    onDuration = 0,
                    costEstimate = 0,
                    data = new List<object>()
                });
            }
            double totalConsumption = 0;
            double avgConsumption = 0;
            double peakConsumption = 0;
            
            if (consumptionData.Count > 0)
            {
                totalConsumption = consumptionData.Sum(c => c.Value);
                avgConsumption = totalConsumption / consumptionData.Count;
                peakConsumption = consumptionData.Max(c => c.Value);
            }
            var onDuration = device.History
                .Where(h => h.Status == "on" && h.Timestamp >= startDateTime && h.Timestamp <= endDateTime)
                .Sum(h => h.Consumption > 0 ? 1 : 0);
            var costPerKwh = 0.15;
            var costEstimate = totalConsumption * costPerKwh;
            
            return Ok(new
            {
                deviceId,
                deviceName = device.Name,
                totalConsumption,
                avgConsumption,
                peakConsumption,
                onDuration,
                costEstimate,
                data = consumptionData
            });
        }

        [HttpGet("distribution/{deviceId}")]
        public async Task<IActionResult> GetDeviceEnergyDistribution(string deviceId, string date)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }
            var device = await _mongoDbService.GetDeviceByIdAsync(deviceId);
            if (device == null || !device.UserIds.Contains(userId))
            {
                return NotFound(new { message = "Device not found or you don't have access to it" });
            }
            
            DateTime targetDate;
            if (!DateTime.TryParse(date, out targetDate))
            {
                targetDate = DateTime.UtcNow.Date;
            }
            var allDevicesConsumption = new List<(string DeviceId, string DeviceName, double Consumption)>();
            var userDevices = await _mongoDbService.GetDevicesByUserIdAsync(userId);
            
            foreach (var userDevice in userDevices)
            {
                var deviceConsumption = await _energyService.GetEnergyConsumptionByDeviceAsync(
                    userId, userDevice.Id, "day", targetDate, targetDate.AddDays(1).AddTicks(-1));
                
                double totalConsumption = 0;
                if (deviceConsumption.Count > 0)
                {
                    totalConsumption = deviceConsumption.Sum(c => c.Value);
                }
                
                allDevicesConsumption.Add((userDevice.Id, userDevice.Name, totalConsumption));
            }
            double totalConsumptionAll = allDevicesConsumption.Sum(d => d.Consumption);
            if (totalConsumptionAll <= 0)
            {
                return Ok(new List<object>());
            }
            
            var colors = new[] { "#4CAF50", "#2196F3", "#FFC107", "#9C27B0", "#F44336", "#607D8B" };
            var result = new List<object>();
            
            for (int i = 0; i < allDevicesConsumption.Count; i++)
            {
                var (currentDeviceId, deviceName, consumption) = allDevicesConsumption[i];
                double percentage = (consumption / totalConsumptionAll) * 100;
                
                result.Add(new
                {
                    deviceId = currentDeviceId,
                    name = deviceName,
                    value = Math.Round(percentage, 1),
                    consumption,
                    color = colors[i % colors.Length]
                });
            }
            
            return Ok(result);
        }

        [HttpGet("summary/{deviceId}")]
        public async Task<IActionResult> GetDeviceEnergySummary(string deviceId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }
            var device = await _mongoDbService.GetDeviceByIdAsync(deviceId);
            if (device == null || !device.UserIds.Contains(userId))
            {
                return NotFound(new { message = "Device not found or you don't have access to it" });
            }
            var today = DateTime.UtcNow.Date;
            var todayConsumption = await _energyService.GetEnergyConsumptionByDeviceAsync(
                userId, deviceId, "day", today, today.AddDays(1).AddTicks(-1));
            
            double todayTotal = 0;
            if (todayConsumption.Count > 0)
            {
                todayTotal = todayConsumption.Sum(c => c.Value);
            }
            var yesterday = today.AddDays(-1);
            var yesterdayConsumption = await _energyService.GetEnergyConsumptionByDeviceAsync(
                userId, deviceId, "day", yesterday, yesterday.AddDays(1).AddTicks(-1));
            
            double yesterdayTotal = 0;
            if (yesterdayConsumption.Count > 0)
            {
                yesterdayTotal = yesterdayConsumption.Sum(c => c.Value);
            }
            var thisMonth = new DateTime(today.Year, today.Month, 1);
            var thisMonthConsumption = await _energyService.GetEnergyConsumptionByDeviceAsync(
                userId, deviceId, "month", thisMonth, thisMonth.AddMonths(1).AddTicks(-1));
            
            double thisMonthTotal = 0;
            if (thisMonthConsumption.Count > 0)
            {
                thisMonthTotal = thisMonthConsumption.Sum(c => c.Value);
            }
            double dayChange = 0;
            if (yesterdayTotal > 0)
            {
                dayChange = Math.Round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100, 1);
            }
            double costPerKwh = 0.15;
            
            return Ok(new
            {
                device = new
                {
                    id = device.Id,
                    name = device.Name,
                    type = device.Type,
                    status = device.Status
                },
                energy = new
                {
                    today = todayTotal,
                    yesterday = yesterdayTotal,
                    thisMonth = thisMonthTotal,
                    dayChange,
                    estimatedCost = thisMonthTotal * costPerKwh
                }
            });
        }
    }
}
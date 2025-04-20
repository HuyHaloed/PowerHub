using MyIoTPlatform.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyIoTPlatform.API.Services
{
    public class EnergyService
    {
        private readonly MongoDbService _mongoDbService;

        public EnergyService(MongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
        }

        // NEW METHOD: Get energy consumption data directly from distribution data
        public async Task<List<EnergyConsumption>> GetConsumptionFromDistributionAsync(string userId, string timeRange, DateTime? startDate = null, DateTime? endDate = null)
        {
            // If no date ranges are provided, determine them based on timeRange
            if (!startDate.HasValue || !endDate.HasValue)
            {
                (startDate, endDate) = GetDateRangeForTimeRange(timeRange);
            }

            // Get all energy distribution data for the user's devices in the time period
            var deviceDistributions = await _mongoDbService.GetAllDistributionsForPeriodAsync(userId, startDate.Value, endDate.Value);
            
            if (deviceDistributions == null || !deviceDistributions.Any())
                return new List<EnergyConsumption>();

            // Group the data based on the selected time range
            var groupedConsumptions = GroupDistributionsByTimeRange(deviceDistributions, userId, timeRange, startDate.Value, endDate.Value);
            
            return groupedConsumptions;
        }
        // Add this method to your EnergyService class

// Get energy consumption data for a specific device
        public async Task<List<EnergyConsumption>> GetEnergyConsumptionByDeviceAsync(string userId, string deviceId, string timeRange, DateTime? startDate = null, DateTime? endDate = null)
        {
            // If no date ranges are provided, determine them based on timeRange
            if (!startDate.HasValue || !endDate.HasValue)
            {
                (startDate, endDate) = GetDateRangeForTimeRange(timeRange);
            }

            // Get all energy distribution data for this specific device in the time period
            var deviceDistributions = await _mongoDbService.GetEnergyDistributionByDeviceAsync(
                userId, deviceId, startDate.Value, endDate.Value);
            
            if (deviceDistributions == null || !deviceDistributions.Any())
                return new List<EnergyConsumption>();

            // Process the distribution data into consumption data points
            var result = new List<EnergyConsumption>();
            
            // Get the device info to include the name
            var device = await _mongoDbService.GetDeviceByIdAsync(deviceId);
            string deviceName = device?.Name ?? "Unknown Device";
            
            switch (timeRange.ToLower())
            {
                case "day":
                    // For day view, create 24 hourly data points
                    DateTime dayStartTime = startDate.Value.Date;
                    
                    for (int hour = 0; hour < 24; hour++)
                    {
                        var hourStart = dayStartTime.AddHours(hour);
                        var hourEnd = hourStart.AddHours(1).AddTicks(-1);
                        
                        // Get all distributions for this hour
                        var hourlyData = deviceDistributions
                            .Where(d => d.Date >= hourStart && d.Date <= hourEnd)
                            .ToList();
                        
                        // Sum the hourly consumption
                        double hourlyTotal = hourlyData.Sum(d => d.Value);
                        
                        result.Add(new EnergyConsumption
                        {
                            UserId = userId,
                            DeviceId = deviceId,
                            DeviceName = deviceName,
                            Value = hourlyTotal,
                            Date = hourStart,
                            TimeRange = timeRange
                        });
                    }
                    break;
                    
                case "week":
                    // For week view, create 7 daily data points
                    for (int dayOffset = 0; dayOffset < 7; dayOffset++)
                    {
                        var dayStart = startDate.Value.Date.AddDays(dayOffset);
                        var dayEnd = dayStart.AddDays(1).AddTicks(-1);
                        
                        // Get all distributions for this day
                        var dailyData = deviceDistributions
                            .Where(d => d.Date >= dayStart && d.Date <= dayEnd)
                            .ToList();
                        
                        // Sum the daily consumption
                        double dailyTotal = dailyData.Sum(d => d.Value);
                        
                        result.Add(new EnergyConsumption
                        {
                            UserId = userId,
                            DeviceId = deviceId,
                            DeviceName = deviceName,
                            Value = dailyTotal,
                            Date = dayStart,
                            TimeRange = timeRange
                        });
                    }
                    break;
                    
                case "month":
                    // For month view, create one data point per day
                    int daysInMonth = DateTime.DaysInMonth(startDate.Value.Year, startDate.Value.Month);
                    
                    for (int day = 1; day <= daysInMonth; day++)
                    {
                        var dayStart = new DateTime(startDate.Value.Year, startDate.Value.Month, day);
                        var dayEnd = dayStart.AddDays(1).AddTicks(-1);
                        
                        var dailyData = deviceDistributions
                            .Where(d => d.Date >= dayStart && d.Date <= dayEnd)
                            .ToList();
                        
                        double dailyTotal = dailyData.Sum(d => d.Value);
                        
                        result.Add(new EnergyConsumption
                        {
                            UserId = userId,
                            DeviceId = deviceId,
                            DeviceName = deviceName,
                            Value = dailyTotal,
                            Date = dayStart,
                            TimeRange = timeRange
                        });
                    }
                    break;
                    
                case "year":
                    // For year view, create one data point per month
                    for (int month = 1; month <= 12; month++)
                    {
                        var monthStart = new DateTime(startDate.Value.Year, month, 1);
                        var monthEnd = monthStart.AddMonths(1).AddTicks(-1);
                        
                        var monthlyData = deviceDistributions
                            .Where(d => d.Date >= monthStart && d.Date <= monthEnd)
                            .ToList();
                        
                        double monthlyTotal = monthlyData.Sum(d => d.Value);
                        
                        result.Add(new EnergyConsumption
                        {
                            UserId = userId,
                            DeviceId = deviceId,
                            DeviceName = deviceName,
                            Value = monthlyTotal,
                            Date = monthStart,
                            TimeRange = timeRange
                        });
                    }
                    break;
                    
                default:
                    // If timeRange is not recognized, use day as default
                    // This is just a safety measure
                    var defaultData = await GetEnergyConsumptionByDeviceAsync(userId, deviceId, "day", startDate, endDate);
                    return defaultData;
            }
            
            return result;
        }
        // Helper method to determine date ranges based on time range
        private (DateTime start, DateTime end) GetDateRangeForTimeRange(string timeRange)
        {
            DateTime now = DateTime.UtcNow;
            DateTime startDate;
            DateTime endDate;

            switch (timeRange.ToLower())
            {
                case "hour":
                    // Last hour
                    startDate = now.AddHours(-1);
                    endDate = now;
                    break;
                case "day":
                    // Current day (00:00 to 23:59)
                    startDate = now.Date;
                    endDate = startDate.AddDays(1).AddTicks(-1);
                    break;
                case "week":
                    // Current week (Monday to Sunday)
                    int daysToSubtract = (int)now.DayOfWeek == 0 ? 6 : (int)now.DayOfWeek - 1;
                    startDate = now.Date.AddDays(-daysToSubtract);
                    endDate = startDate.AddDays(7).AddTicks(-1);
                    break;
                case "month":
                    // Current month (1st to last day)
                    startDate = new DateTime(now.Year, now.Month, 1);
                    endDate = startDate.AddMonths(1).AddTicks(-1);
                    break;
                case "year":
                    // Current year (Jan 1 to Dec 31)
                    startDate = new DateTime(now.Year, 1, 1);
                    endDate = startDate.AddYears(1).AddTicks(-1);
                    break;
                default:
                    // Default to current day
                    startDate = now.Date;
                    endDate = startDate.AddDays(1).AddTicks(-1);
                    break;
            }

            return (startDate, endDate);
        }

    
        private List<EnergyConsumption> GroupDistributionsByTimeRange(
            List<EnergyDistribution> distributions, 
            string userId, 
            string timeRange, 
            DateTime startDate, 
            DateTime endDate)
        {
            var result = new List<EnergyConsumption>();
            
            // Group distributions by device first
            var deviceGroups = distributions.GroupBy(d => d.DeviceId);
            
            switch (timeRange.ToLower())
            {
                case "day":
                    // Create exactly 24 data points (0-23 hours) for the selected day
                    var selectedDayStart = startDate.Date; // Make sure we're working with midnight of the selected day
                    
                    for (int hour = 0; hour < 24; hour++)
                    {

                        var hourStart = selectedDayStart.AddHours(hour);
                        var hourEnd = hourStart.AddHours(1).AddTicks(-1);
                        
                        // Sum consumption from all devices in this hour
                        double hourlyTotal = 0;
                        
                        foreach (var deviceGroup in deviceGroups)
                        {
                            // Find all distributions for this device in this specific hour
                            var deviceHourlyData = deviceGroup
                                .Where(d => d.Date >= hourStart && d.Date <= hourEnd)
                                .ToList();
                            
                            // Sum the absolute values (not the percentages)
                            hourlyTotal += deviceHourlyData.Sum(d => d.Value);
                        }
                        
                        // Create a data point for this hour with the total consumption
                        result.Add(new EnergyConsumption
                        {
                            UserId = userId,
                            DeviceId = null,
                            DeviceName = "Tổng tiêu thụ",
                            Value = hourlyTotal,
                            Date = hourStart,
                            TimeRange = timeRange
                        });
                    }
                    break;
                
                case "week":
                    // Create 7 data points, one for each day of the week
                    // For a full week (Monday through Sunday)
                    for (int dayOffset = 0; dayOffset < 7; dayOffset++)
                    {
                        var currentDayStart = startDate.AddDays(dayOffset);
                        var currentDayEnd = currentDayStart.AddDays(1).AddTicks(-1);
                        
                        // Sum consumption from all devices for this day
                        double dailyTotal = 0;
                        
                        foreach (var deviceGroup in deviceGroups)
                        {
                            var deviceDailyData = deviceGroup
                                .Where(d => d.Date >= currentDayStart && d.Date <= currentDayEnd)
                                .ToList();
                            
                            dailyTotal += deviceDailyData.Sum(d => d.Value);
                        }
                        
                        // Add daily data point for this day of the week
                        result.Add(new EnergyConsumption
                        {
                            UserId = userId,
                            DeviceId = null, 
                            DeviceName = "Tổng tiêu thụ",
                            Value = dailyTotal,
                            Date = currentDayStart, // Use the start of the day
                            TimeRange = timeRange
                        });
                    }
                    break;
                    
                case "month":
                    // Create one data point for each day of the month
                    int daysInMonth = DateTime.DaysInMonth(startDate.Year, startDate.Month);
                    
                    for (int day = 1; day <= daysInMonth; day++)
                    {
                        var dayStart = new DateTime(startDate.Year, startDate.Month, day);
                        var dayEnd = dayStart.AddDays(1).AddTicks(-1);
                        
                        double dailyTotal = 0;
                        
                        foreach (var deviceGroup in deviceGroups)
                        {
                            var deviceDailyData = deviceGroup
                                .Where(d => d.Date >= dayStart && d.Date <= dayEnd)
                                .ToList();
                            
                            dailyTotal += deviceDailyData.Sum(d => d.Value);
                        }
                        
                        result.Add(new EnergyConsumption
                        {
                            UserId = userId,
                            DeviceId = null,
                            DeviceName = "Tổng tiêu thụ",
                            Value = dailyTotal,
                            Date = dayStart,
                            TimeRange = timeRange
                        });
                    }
                    break;
                    
                case "year":
                    // Create 12 data points, one for each month
                    for (int month = 1; month <= 12; month++)
                    {
                        var monthStart = new DateTime(startDate.Year, month, 1);
                        var monthEnd = monthStart.AddMonths(1).AddTicks(-1);
                        
                        double monthlyTotal = 0;
                        
                        foreach (var deviceGroup in deviceGroups)
                        {
                            var deviceMonthlyData = deviceGroup
                                .Where(d => d.Date >= monthStart && d.Date <= monthEnd)
                                .ToList();
                            
                            monthlyTotal += deviceMonthlyData.Sum(d => d.Value);
                        }
                        
                        result.Add(new EnergyConsumption
                        {
                            UserId = userId,
                            DeviceId = null,
                            DeviceName = "Tổng tiêu thụ",
                            Value = monthlyTotal,
                            Date = monthStart,
                            TimeRange = timeRange
                        });
                    }
                    break;
            }
            
            return result;
        }

        // Add this method to your EnergyService class

// Get energy consumption data with fixed time range calculation
        public async Task<List<EnergyConsumption>> GetEnergyConsumptionAsync(string userId, string timeRange, DateTime? startDate = null, DateTime? endDate = null)
        {
            // If no date ranges are provided, determine them based on timeRange
            if (!startDate.HasValue || !endDate.HasValue)
            {
                (startDate, endDate) = GetDateRangeForTimeRange(timeRange);
            }

            // Get all energy distribution data for the user's devices in the time period
            var deviceDistributions = await _mongoDbService.GetAllDistributionsForUserAsync(userId, startDate.Value, endDate.Value);
            
            if (deviceDistributions == null || !deviceDistributions.Any())
                return new List<EnergyConsumption>();

            // Group the data based on the selected time range
            var groupedConsumptions = GroupDistributionsByTimeRange(deviceDistributions, userId, timeRange, startDate.Value, endDate.Value);
            
            return groupedConsumptions;
        }

        public async Task<List<EnergyConsumption>> GetHourlyEnergyForDayAsync(string userId, DateTime date)
        {
            // Get the distributions for this user's devices on this specific day
            var distributions = await _mongoDbService.GetHourlyDistributionsForDayAsync(userId, date);
            
            if (distributions == null || !distributions.Any())
                return CreateEmptyHourlyData(userId, date);
            
            // Create 24 data points, one for each hour of the day
            var result = new List<EnergyConsumption>();
            DateTime dayStart = date.Date;
            
            for (int hour = 0; hour < 24; hour++)
            {
                var hourStart = dayStart.AddHours(hour);
                var hourEnd = hourStart.AddHours(1).AddTicks(-1);
                
                // Sum consumption from all devices for this hour
                double hourlyTotal = distributions
                    .Where(d => 
                        d.Date >= hourStart && 
                        d.Date <= hourEnd)
                    .Sum(d => d.Value);
                
                // Add hourly data point
                result.Add(new EnergyConsumption
                {
                    UserId = userId,
                    DeviceId = null,
                    DeviceName = "Tổng tiêu thụuuuuuu",
                    Value = hourlyTotal,
                    Date = hourStart,
                    TimeRange = "day"
                });
            }
            
            return result;
        }

        // Helper method to create empty hourly data for a day
        private List<EnergyConsumption> CreateEmptyHourlyData(string userId, DateTime date)
        {
            var result = new List<EnergyConsumption>();
            DateTime dayStart = date.Date;
            
            // Create 24 data points with zero consumption
            for (int hour = 0; hour < 24; hour++)
            {
                result.Add(new EnergyConsumption
                {
                    UserId = userId,
                    DeviceId = null,
                    DeviceName = "Tổng tiêu thụ",
                    Value = 0,
                    Date = dayStart.AddHours(hour),
                    TimeRange = "day"
                });
            }
            
            return result;
        }

        // Get energy distribution data
        public async Task<List<object>> GetEnergyDistributionAsync(string userId, DateTime date)
        {
            // Get consumption for all devices on the selected day
            var startDate = date.Date;
            var endDate = startDate.AddDays(1).AddTicks(-1);
            
            // Get all devices for the user
            var devices = await _mongoDbService.GetDevicesByUserIdAsync(userId);
            
            // Get consumption for each device on that day
            var deviceConsumptions = new List<(string DeviceId, string DeviceName, double Consumption, string Color)>();
            var colors = new[] { "#4CAF50", "#2196F3", "#FFC107", "#9C27B0", "#F44336", "#607D8B" };
            
            int colorIndex = 0;
            foreach (var device in devices)
            {
                // Get all distribution records for this device for the day
                var distributions = await _mongoDbService.GetEnergyDistributionByDeviceAsync(
                    userId, device.Id, startDate, endDate);
                
                // Calculate total consumption for this device on this day
                double deviceTotal = distributions.Sum(d => d.Value);
                
                deviceConsumptions.Add((
                    device.Id, 
                    device.Name, 
                    deviceTotal,
                    colors[colorIndex % colors.Length]
                ));
                
                colorIndex++;
            }
            
            // Calculate total consumption for all devices
            double totalConsumption = deviceConsumptions.Sum(dc => dc.Consumption);
            
            // If no consumption, return empty list
            if (totalConsumption <= 0)
                return new List<object>();
            
            // Create list of energy distribution percentages
            var result = new List<object>();
            
            foreach (var (deviceId, deviceName, consumption, color) in deviceConsumptions)
            {
                // Only include devices with consumption > 0
                if (consumption > 0)
                {
                    // Calculate percentage
                    double percentage = (consumption / totalConsumption) * 100;
                    
                    result.Add(new
                    {
                        deviceId,
                        name = deviceName,
                        value = Math.Round(percentage, 1), // Round to 1 decimal place
                        consumption, // Keep actual consumption for reference
                        color
                    });
                }
            }
            
            return result;
        }

        // Calculate daily energy consumption
        public async Task<double> GetDailyConsumptionAsync(string userId, DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1).AddTicks(-1);
            
            // Get distribution data for all devices on this day
            var distributions = await _mongoDbService.GetAllDistributionsForDayAsync(userId, date);
            
            // Sum all distribution values to get total consumption
            return distributions.Sum(d => d.Value);
        }

        // Calculate monthly energy consumption
        public async Task<double> GetMonthlyConsumptionAsync(string userId, int year, int month)
        {
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1).AddTicks(-1);
            
            // Get distribution data for all devices in this month
            var distributions = await _mongoDbService.GetAllDistributionsForPeriodAsync(userId, startDate, endDate);
            
            // Sum all distribution values to get total consumption
            return distributions.Sum(d => d.Value);
        }

        // Calculate yearly energy consumption
        public async Task<double> GetYearlyConsumptionAsync(string userId, int year)
        {
            var startDate = new DateTime(year, 1, 1);
            var endDate = startDate.AddYears(1).AddTicks(-1);
            
            // Get distribution data for all devices in this year
            var distributions = await _mongoDbService.GetAllDistributionsForPeriodAsync(userId, startDate, endDate);
            
            // Sum all distribution values to get total consumption
            return distributions.Sum(d => d.Value);
        }

        // Generate energy consumption predictions
        public async Task<List<EnergyConsumption>> GetEnergyPredictionsAsync(string userId, string timeRange, int periods)
        {
            var predictions = new List<EnergyConsumption>();
            
            // Define the historical period based on the requested time range
            DateTime startDate;
            DateTime endDate = DateTime.UtcNow;
            
            switch (timeRange.ToLower())
            {
                case "hour":
                    startDate = endDate.AddDays(-7);
                    break;
                case "day":
                    startDate = endDate.AddMonths(-1);
                    break;
                case "week":
                    startDate = endDate.AddMonths(-3);
                    break;
                case "month":
                    startDate = endDate.AddYears(-1);
                    break;
                default:
                    startDate = endDate.AddDays(-30);
                    break;
            }
            
            // Get historical distribution data
            var historicalDistributions = await _mongoDbService.GetAllDistributionsForPeriodAsync(userId, startDate, endDate);
            
            if (historicalDistributions.Count == 0)
                return predictions;
            
            // Group by day to create daily consumption data for prediction
            var dailyConsumption = historicalDistributions
                .GroupBy(d => d.Date.Date)
                .Select(g => new 
                {
                    Date = g.Key,
                    Consumption = g.Sum(d => d.Value)
                })
                .ToList();
            
            // Calculate average and standard deviation for prediction model
            var avgConsumption = dailyConsumption.Average(d => d.Consumption);
            var stdDeviation = Math.Sqrt(dailyConsumption.Sum(d => Math.Pow(d.Consumption - avgConsumption, 2)) / dailyConsumption.Count);
            
            // Generate predictions
            var lastDate = dailyConsumption.Count > 0 
                ? dailyConsumption.Max(d => d.Date) 
                : DateTime.UtcNow.Date;
            
            for (int i = 1; i <= periods; i++)
            {
                DateTime predictionDate;
                
                switch (timeRange.ToLower())
                {
                    case "hour":
                        predictionDate = lastDate.AddHours(i);
                        break;
                    case "day":
                        predictionDate = lastDate.AddDays(i);
                        break;
                    case "week":
                        predictionDate = lastDate.AddDays(i * 7);
                        break;
                    case "month":
                        predictionDate = lastDate.AddMonths(i);
                        break;
                    default:
                        predictionDate = lastDate.AddDays(i);
                        break;
                }
                
                // Add small random variation
                var random = new Random();
                var variation = (random.NextDouble() * 2 - 1) * stdDeviation * 0.5;
                var predictedValue = avgConsumption + variation;
                
                predictions.Add(new EnergyConsumption
                {
                    Id = null,
                    UserId = userId,
                    DeviceId = null,
                    DeviceName = "Prediction",
                    Value = Math.Max(0, predictedValue),
                    Date = predictionDate,
                    TimeRange = timeRange
                });
            }
            
            return predictions;
        }

        // Compare energy consumption with previous period
        public async Task<(List<EnergyConsumption> currentPeriod, List<EnergyConsumption> previousPeriod, double change)> CompareEnergyUsageAsync(
            string userId, string timeRange, DateTime? startDate = null, DateTime? endDate = null)
        {
            DateTime currentStartDate;
            DateTime currentEndDate;
            DateTime previousStartDate;
            DateTime previousEndDate;
            
            if (startDate.HasValue && endDate.HasValue)
            {
                currentStartDate = startDate.Value;
                currentEndDate = endDate.Value;
                
                var periodSpan = currentEndDate - currentStartDate;
                previousStartDate = currentStartDate.AddTicks(-periodSpan.Ticks);
                previousEndDate = currentStartDate.AddTicks(-1);
            }
            else
            {
                // Default to comparing current and previous periods
                (currentStartDate, currentEndDate) = GetDateRangeForTimeRange(timeRange);
                
                switch (timeRange.ToLower())
                {
                    case "day":
                        previousStartDate = currentStartDate.AddDays(-1);
                        previousEndDate = currentEndDate.AddDays(-1);
                        break;
                    case "week":
                        previousStartDate = currentStartDate.AddDays(-7);
                        previousEndDate = currentEndDate.AddDays(-7);
                        break;
                    case "month":
                        previousStartDate = currentStartDate.AddMonths(-1);
                        previousEndDate = new DateTime(previousStartDate.Year, previousStartDate.Month, 
                            DateTime.DaysInMonth(previousStartDate.Year, previousStartDate.Month), 23, 59, 59, 999);
                        break;
                    case "year":
                        previousStartDate = currentStartDate.AddYears(-1);
                        previousEndDate = currentEndDate.AddYears(-1);
                        break;
                    default:
                        previousStartDate = currentStartDate.AddDays(-1);
                        previousEndDate = currentEndDate.AddDays(-1);
                        break;
                }
            }
            
            // Get current and previous consumption from distribution data
            var currentData = await GetConsumptionFromDistributionAsync(userId, timeRange, currentStartDate, currentEndDate);
            var previousData = await GetConsumptionFromDistributionAsync(userId, timeRange, previousStartDate, previousEndDate);
            
            var currentTotal = currentData.Sum(d => d.Value);
            var previousTotal = previousData.Sum(d => d.Value);
            
            double change = 0;
            if (previousTotal > 0)
            {
                change = Math.Round(((currentTotal - previousTotal) / previousTotal) * 100, 1);
            }
            
            return (currentData, previousData, change);
        }
    }
}

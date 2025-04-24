using MyIoTPlatform.API.Models;
namespace MyIoTPlatform.API.Services
{
    public class EnergyService
    {
        private readonly MongoDbService _mongoDbService;

        public EnergyService(MongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
        }
        public async Task<List<EnergyConsumption>> GetConsumptionFromDistributionAsync(string userId, string timeRange, DateTime? startDate = null, DateTime? endDate = null)
        {
            if (!startDate.HasValue || !endDate.HasValue)
            {
                (startDate, endDate) = GetDateRangeForTimeRange(timeRange);
            }
            var deviceDistributions = await _mongoDbService.GetAllDistributionsForPeriodAsync(userId, startDate.Value, endDate.Value);
            if (deviceDistributions == null || !deviceDistributions.Any())
                return new List<EnergyConsumption>();

            var groupedConsumptions = GroupDistributionsByTimeRange(deviceDistributions, userId, timeRange, startDate.Value, endDate.Value);
            
            return groupedConsumptions;
        }
        public async Task<List<EnergyConsumption>> GetEnergyConsumptionByDeviceAsync(string userId, string deviceId, string timeRange, DateTime? startDate = null, DateTime? endDate = null)
        {
            if (!startDate.HasValue || !endDate.HasValue)
            {
                (startDate, endDate) = GetDateRangeForTimeRange(timeRange);
            }
            var deviceDistributions = await _mongoDbService.GetEnergyDistributionByDeviceAsync(
                userId, deviceId, startDate.Value, endDate.Value);
            
            if (deviceDistributions == null || !deviceDistributions.Any())
                return new List<EnergyConsumption>();

            var result = new List<EnergyConsumption>();
            var device = await _mongoDbService.GetDeviceByIdAsync(deviceId);
            string deviceName = device?.Name ?? "Unknown Device";
            
            switch (timeRange.ToLower())
            {
                case "day":
                    DateTime dayStartTime = startDate.Value.Date;
                    
                    for (int hour = 0; hour < 24; hour++)
                    {
                        var hourStart = dayStartTime.AddHours(hour);
                        var hourEnd = hourStart.AddHours(1).AddTicks(-1);
                        var hourlyData = deviceDistributions
                            .Where(d => d.Date >= hourStart && d.Date <= hourEnd)
                            .ToList();
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
                    for (int dayOffset = 0; dayOffset < 7; dayOffset++)
                    {
                        var dayStart = startDate.Value.Date.AddDays(dayOffset);
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
                    
                case "month":
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
                    var defaultData = await GetEnergyConsumptionByDeviceAsync(userId, deviceId, "day", startDate, endDate);
                    return defaultData;
            }
            
            return result;
        }
        private (DateTime start, DateTime end) GetDateRangeForTimeRange(string timeRange)
        {
            DateTime now = DateTime.UtcNow;
            DateTime startDate;
            DateTime endDate;

            switch (timeRange.ToLower())
            {
                case "hour":
                    startDate = now.AddHours(-1);
                    endDate = now;
                    break;
                case "day":
                    startDate = now.Date;
                    endDate = startDate.AddDays(1).AddTicks(-1);
                    break;
                case "week":
                    int daysToSubtract = (int)now.DayOfWeek == 0 ? 6 : (int)now.DayOfWeek - 1;
                    startDate = now.Date.AddDays(-daysToSubtract);
                    endDate = startDate.AddDays(7).AddTicks(-1);
                    break;
                case "month":
                    startDate = new DateTime(now.Year, now.Month, 1);
                    endDate = startDate.AddMonths(1).AddTicks(-1);
                    break;
                case "year":
                    startDate = new DateTime(now.Year, 1, 1);
                    endDate = startDate.AddYears(1).AddTicks(-1);
                    break;
                default:
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
            var deviceGroups = distributions.GroupBy(d => d.DeviceId);
            switch (timeRange.ToLower())
            {
                case "day":
                    var selectedDayStart = startDate.Date;
                    
                    for (int hour = 0; hour < 24; hour++)
                    {
                        var hourStart = selectedDayStart.AddHours(hour);
                        var hourEnd = hourStart.AddHours(1).AddTicks(-1);
                        double hourlyTotal = 0;
                        foreach (var deviceGroup in deviceGroups)
                        {
                            var deviceHourlyData = deviceGroup
                                .Where(d => d.Date >= hourStart && d.Date <= hourEnd)
                                .ToList();
                            hourlyTotal += deviceHourlyData.Sum(d => d.Value);
                        }
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
                    for (int dayOffset = 0; dayOffset < 7; dayOffset++)
                    {
                        var currentDayStart = startDate.AddDays(dayOffset);
                        var currentDayEnd = currentDayStart.AddDays(1).AddTicks(-1);
                        double dailyTotal = 0;
                        
                        foreach (var deviceGroup in deviceGroups)
                        {
                            var deviceDailyData = deviceGroup
                                .Where(d => d.Date >= currentDayStart && d.Date <= currentDayEnd)
                                .ToList();
                            
                            dailyTotal += deviceDailyData.Sum(d => d.Value);
                        }
                        result.Add(new EnergyConsumption
                        {
                            UserId = userId,
                            DeviceId = null, 
                            DeviceName = "Tổng tiêu thụ",
                            Value = dailyTotal,
                            Date = currentDayStart,
                            TimeRange = timeRange
                        });
                    }
                    break;
                case "month":
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
        public async Task<List<EnergyConsumption>> GetEnergyConsumptionAsync(string userId, string timeRange, DateTime? startDate = null, DateTime? endDate = null)
        {
            if (!startDate.HasValue || !endDate.HasValue)
            {
                (startDate, endDate) = GetDateRangeForTimeRange(timeRange);
            }
            var deviceDistributions = await _mongoDbService.GetAllDistributionsForUserAsync(userId, startDate.Value, endDate.Value);
            
            if (deviceDistributions == null || !deviceDistributions.Any())
                return new List<EnergyConsumption>();

            var groupedConsumptions = GroupDistributionsByTimeRange(deviceDistributions, userId, timeRange, startDate.Value, endDate.Value);
            
            return groupedConsumptions;
        }

        public async Task<List<EnergyConsumption>> GetHourlyEnergyForDayAsync(string userId, DateTime date)
        {
            var distributions = await _mongoDbService.GetHourlyDistributionsForDayAsync(userId, date);
            
            if (distributions == null || !distributions.Any())
                return CreateEmptyHourlyData(userId, date);
            var result = new List<EnergyConsumption>();
            DateTime dayStart = date.Date;
            
            for (int hour = 0; hour < 24; hour++)
            {
                var hourStart = dayStart.AddHours(hour);
                var hourEnd = hourStart.AddHours(1).AddTicks(-1);
                double hourlyTotal = distributions
                    .Where(d => 
                        d.Date >= hourStart && 
                        d.Date <= hourEnd)
                    .Sum(d => d.Value);
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
        private List<EnergyConsumption> CreateEmptyHourlyData(string userId, DateTime date)
        {
            var result = new List<EnergyConsumption>();
            DateTime dayStart = date.Date;
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
        public async Task<List<object>> GetEnergyDistributionAsync(string userId, DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1).AddTicks(-1);
            var devices = await _mongoDbService.GetDevicesByUserIdAsync(userId);
            var deviceConsumptions = new List<(string DeviceId, string DeviceName, double Consumption, string Color)>();
            var colors = new[] { "#4CAF50", "#2196F3", "#FFC107", "#9C27B0", "#F44336", "#607D8B" };
            int colorIndex = 0;
            foreach (var device in devices)
            {
                var distributions = await _mongoDbService.GetEnergyDistributionByDeviceAsync(
                    userId, device.Id, startDate, endDate);
                double deviceTotal = distributions.Sum(d => d.Value);
                deviceConsumptions.Add((
                    device.Id, 
                    device.Name, 
                    deviceTotal,
                    colors[colorIndex % colors.Length]
                ));
                
                colorIndex++;
            }
                        double totalConsumption = deviceConsumptions.Sum(dc => dc.Consumption);
            if (totalConsumption <= 0)
                return new List<object>();
            
            var result = new List<object>();
            
            foreach (var (deviceId, deviceName, consumption, color) in deviceConsumptions)
            {
                if (consumption > 0)
                {
                    double percentage = (consumption / totalConsumption) * 100;
                    
                    result.Add(new
                    {
                        deviceId,
                        name = deviceName,
                        value = Math.Round(percentage, 1), 
                        consumption, 
                        color
                    });
                }
            }
            
            return result;
        }
        public async Task<double> GetDailyConsumptionAsync(string userId, DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1).AddTicks(-1);
            var distributions = await _mongoDbService.GetAllDistributionsForDayAsync(userId, date);
            return distributions.Sum(d => d.Value);
        }
        public async Task<double> GetMonthlyConsumptionAsync(string userId, int year, int month)
        {
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1).AddTicks(-1);
            var distributions = await _mongoDbService.GetAllDistributionsForPeriodAsync(userId, startDate, endDate);
            return distributions.Sum(d => d.Value);
        }
        public async Task<double> GetYearlyConsumptionAsync(string userId, int year)
        {
            var startDate = new DateTime(year, 1, 1);
            var endDate = startDate.AddYears(1).AddTicks(-1);
            var distributions = await _mongoDbService.GetAllDistributionsForPeriodAsync(userId, startDate, endDate);
            return distributions.Sum(d => d.Value);
        }
        public async Task<List<EnergyConsumption>> GetEnergyPredictionsAsync(string userId, string timeRange, int periods)
        {
            var predictions = new List<EnergyConsumption>();
            
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
            var historicalDistributions = await _mongoDbService.GetAllDistributionsForPeriodAsync(userId, startDate, endDate);
            if (historicalDistributions.Count == 0)
                return predictions;
            var dailyConsumption = historicalDistributions
                .GroupBy(d => d.Date.Date)
                .Select(g => new 
                {
                    Date = g.Key,
                    Consumption = g.Sum(d => d.Value)
                })
                .ToList();
            var avgConsumption = dailyConsumption.Average(d => d.Consumption);
            var stdDeviation = Math.Sqrt(dailyConsumption.Sum(d => Math.Pow(d.Consumption - avgConsumption, 2)) / dailyConsumption.Count);
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
            }// chổ này để chưa phải là đại diện cho module AI nhe
            
            return predictions;
        }
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

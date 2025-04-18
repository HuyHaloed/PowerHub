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

        // Get energy consumption data
        public async Task<List<EnergyConsumption>> GetEnergyConsumptionAsync(string userId, string timeRange, DateTime? startDate = null, DateTime? endDate = null)
        {
            return await _mongoDbService.GetEnergyConsumptionAsync(userId, timeRange, startDate, endDate);
        }

        // Get energy consumption data by device
        public async Task<List<EnergyConsumption>> GetEnergyConsumptionByDeviceAsync(string userId, string deviceId, string timeRange, DateTime? startDate = null, DateTime? endDate = null)
        {
            return await _mongoDbService.GetEnergyConsumptionByDeviceAsync(userId, deviceId, timeRange, startDate, endDate);
        }

        // Add energy consumption data
        public async Task AddEnergyConsumptionAsync(EnergyConsumption energyConsumption)
        {
            await _mongoDbService.AddEnergyConsumptionAsync(energyConsumption);
        }

        // Get energy distribution data
        public async Task<List<EnergyDistribution>> GetEnergyDistributionAsync(string userId, DateTime date)
        {
            return await _mongoDbService.GetEnergyDistributionAsync(userId, date);
        }

        // Calculate daily energy consumption
        public async Task<double> GetDailyConsumptionAsync(string userId, DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1).AddTicks(-1);
            
            var consumptionData = await _mongoDbService.GetEnergyConsumptionAsync(userId, "day", startDate, endDate);
            return consumptionData.Sum(c => c.Value);
        }

        // Calculate monthly energy consumption
        public async Task<double> GetMonthlyConsumptionAsync(string userId, int year, int month)
        {
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1).AddTicks(-1);
            
            var consumptionData = await _mongoDbService.GetEnergyConsumptionAsync(userId, "month", startDate, endDate);
            return consumptionData.Sum(c => c.Value);
        }

        // Calculate yearly energy consumption
        public async Task<double> GetYearlyConsumptionAsync(string userId, int year)
        {
            var startDate = new DateTime(year, 1, 1);
            var endDate = startDate.AddYears(1).AddTicks(-1);
            
            var consumptionData = await _mongoDbService.GetEnergyConsumptionAsync(userId, "year", startDate, endDate);
            return consumptionData.Sum(c => c.Value);
        }

        // Generate energy consumption predictions
        public async Task<List<EnergyConsumption>> GetEnergyPredictionsAsync(string userId, string timeRange, int periods)
        {
            var predictions = new List<EnergyConsumption>();
            
            // Get historical data
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
            
            var historicalData = await _mongoDbService.GetEnergyConsumptionAsync(userId, timeRange, startDate, endDate);
            
            if (historicalData.Count == 0)
                return predictions;
            
            // Simple moving average prediction (this is a simplified approach)
            var avgConsumption = historicalData.Average(d => d.Value);
            var stdDeviation = Math.Sqrt(historicalData.Sum(d => Math.Pow(d.Value - avgConsumption, 2)) / historicalData.Count);
            
            // Generate predictions
            var lastDate = historicalData.Max(d => d.Date);
            
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
                switch (timeRange.ToLower())
                {
                    case "day":
                        currentStartDate = DateTime.UtcNow.Date;
                        currentEndDate = currentStartDate.AddDays(1).AddTicks(-1);
                        previousStartDate = currentStartDate.AddDays(-1);
                        previousEndDate = currentStartDate.AddTicks(-1);
                        break;
                    case "week":
                        currentStartDate = DateTime.UtcNow.AddDays(-(int)DateTime.UtcNow.DayOfWeek).Date;
                        currentEndDate = currentStartDate.AddDays(7).AddTicks(-1);
                        previousStartDate = currentStartDate.AddDays(-7);
                        previousEndDate = currentStartDate.AddTicks(-1);
                        break;
                    case "month":
                        currentStartDate = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
                        currentEndDate = currentStartDate.AddMonths(1).AddTicks(-1);
                        previousStartDate = currentStartDate.AddMonths(-1);
                        previousEndDate = currentStartDate.AddTicks(-1);
                        break;
                    case "year":
                        currentStartDate = new DateTime(DateTime.UtcNow.Year, 1, 1);
                        currentEndDate = currentStartDate.AddYears(1).AddTicks(-1);
                        previousStartDate = currentStartDate.AddYears(-1);
                        previousEndDate = currentStartDate.AddTicks(-1);
                        break;
                    default:
                        currentStartDate = DateTime.UtcNow.Date;
                        currentEndDate = currentStartDate.AddDays(1).AddTicks(-1);
                        previousStartDate = currentStartDate.AddDays(-1);
                        previousEndDate = currentStartDate.AddTicks(-1);
                        break;
                }
            }
            
            var currentData = await _mongoDbService.GetEnergyConsumptionAsync(userId, timeRange, currentStartDate, currentEndDate);
            var previousData = await _mongoDbService.GetEnergyConsumptionAsync(userId, timeRange, previousStartDate, previousEndDate);
            
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
using MyIoTPlatform.API.Models;


namespace MyIoTPlatform.API.Services
{
    public class DashboardService
    {
        private readonly MongoDbService _mongoDbService;
        private readonly EnergyService _energyService;

        public DashboardService(MongoDbService mongoDbService, EnergyService energyService)
        {
            _mongoDbService = mongoDbService;
            _energyService = energyService;
        }

        // Get dashboard quick stats for a user
        public async Task<List<Stat>> GetQuickStatsForUserAsync(string userId)
        {
            var stats = new List<Stat>();
            
            // Get energy consumption for today
            var todayConsumption = await _energyService.GetDailyConsumptionAsync(userId, DateTime.UtcNow);
            var yesterdayConsumption = await _energyService.GetDailyConsumptionAsync(userId, DateTime.UtcNow.AddDays(-1));
            
            double todayChange = 0;
            if (yesterdayConsumption > 0)
            {
                todayChange = Math.Round(((todayConsumption - yesterdayConsumption) / yesterdayConsumption) * 100, 1);
            }
            
            stats.Add(new Stat
            {
                Title = "Mức tiêu thụ trong ngày",
                Value = todayConsumption,
                Unit = "kWh",
                Change = todayChange,
                ChangeType = todayChange >= 0 ? "increase" : "decrease",
            });
            
            // Get energy consumption for the current month
            var thisMonthConsumption = await _energyService.GetMonthlyConsumptionAsync(userId, DateTime.UtcNow.Year, DateTime.UtcNow.Month);
            var lastMonthConsumption = await _energyService.GetMonthlyConsumptionAsync(userId, DateTime.UtcNow.AddMonths(-1).Year, DateTime.UtcNow.AddMonths(-1).Month);
            
            double monthChange = 0;
            if (lastMonthConsumption > 0)
            {
                monthChange = Math.Round(((thisMonthConsumption - lastMonthConsumption) / lastMonthConsumption) * 100, 1);
            }
            
            stats.Add(new Stat
            {
                Title = "Mức tiêu thụ trong tháng",
                Value = thisMonthConsumption,
                Unit = "kWh",
                Change = monthChange,
                ChangeType = monthChange >= 0 ? "increase" : "decrease",
            });
            
            // Get active device count
            var activeDevices = await _mongoDbService.GetActiveDevicesByUserIdAsync(userId);
            var allDevices = await _mongoDbService.GetDevicesByUserIdAsync(userId);
            
            double deviceChange = 0;
            if (allDevices.Count > 0)
            {
                var lastWeekActiveCount = allDevices.Count(d => d.LastUpdated > DateTime.UtcNow.AddDays(-7));
                deviceChange = Math.Round(((double)activeDevices.Count - lastWeekActiveCount) / lastWeekActiveCount * 100, 1);
            }
            
            stats.Add(new Stat
            {
                Title = "Số thiết bị hoạt động",
                Value = activeDevices.Count,
                Unit = "devices",
                Change = deviceChange,
                ChangeType = deviceChange >= 0 ? "increase" : "decrease",
            });
            
            // Calculate estimated cost
            var costPerKwh = 0.15; // Default cost per kWh
            var estimatedCost = thisMonthConsumption * costPerKwh;
            var lastMonthCost = lastMonthConsumption * costPerKwh;
            
            double costChange = 0;
            if (lastMonthCost > 0)
            {
                costChange = Math.Round(((estimatedCost - lastMonthCost) / lastMonthCost) * 100, 1);
            }
            
            stats.Add(new Stat
            {
                Title = "Estimated Cost",
                Value = estimatedCost,
                Unit = "VND",
                Change = costChange,
                ChangeType = costChange >= 0 ? "increase" : "decrease",
            });
            
            return stats;
        }

        // Get dashboard stats for a user
        public async Task<List<Stat>> GetStatsForUserAsync(string userId)
        {
            return await GetQuickStatsForUserAsync(userId);
        }

        // Get alerts for a user
        public async Task<List<Alert>> GetAlertsForUserAsync(string userId)
        {
            return await _mongoDbService.GetAlertsForUserAsync(userId);
        }

        // Get unread alerts for a user
        public async Task<List<Alert>> GetUnreadAlertsForUserAsync(string userId)
        {
            return await _mongoDbService.GetUnreadAlertsForUserAsync(userId);
        }

        // Mark an alert as read
        public async Task<bool> MarkAlertAsReadAsync(string id, string userId)
        {
            return await _mongoDbService.MarkAlertAsReadAsync(id, userId);
        }

        // Generate an alert for high energy consumption
        public async Task GenerateHighConsumptionAlertAsync(string userId, double consumption, string deviceName = null)
        {
            var user = await _mongoDbService.GetUserByIdAsync(userId);
            var energyGoal = user.Preferences.EnergyGoal;
            
            if (consumption > energyGoal * 0.8)
            {
                var alert = new Alert
                {
                    UserId = userId,
                    Title = "High Energy Consumption",
                    Message = deviceName != null 
                        ? $"Device '{deviceName}' has high energy consumption"
                        : "Your energy consumption is higher than usual",
                    Severity = consumption > energyGoal ? "error" : "warning",
                    Read = false,
                    Date = DateTime.UtcNow
                };
                
                await _mongoDbService.AddAlertAsync(alert);
            }
        }
    }
}
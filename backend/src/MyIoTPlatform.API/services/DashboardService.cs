// src/Services/DashboardService.cs
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MyIoTPlatform.API.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyIoTPlatform.API.Services
{
    public class DashboardService
    {
        private readonly IMongoCollection<User> _usersCollection;
        private readonly IMongoCollection<Device> _devicesCollection;
        private readonly IMongoCollection<Alert> _alertsCollection;
        private readonly IMongoCollection<EnergyConsumption> _energyCollection;

        public DashboardService(IOptions<MongoDbSettings> mongoDBSettings)
        {
            var mongoClient = new MongoClient(mongoDBSettings.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(mongoDBSettings.Value.DatabaseName);
            _usersCollection = mongoDatabase.GetCollection<User>("Users");
            _devicesCollection = mongoDatabase.GetCollection<Device>("Devices");
            _alertsCollection = mongoDatabase.GetCollection<Alert>("Alerts");
            _energyCollection = mongoDatabase.GetCollection<EnergyConsumption>("EnergyConsumption");
        }

        // Lấy thống kê cho người dùng cụ thể
        public async Task<List<Stat>> GetStatsForUserAsync(string userId)
        {
            var stats = new List<Stat>();

            // Tổng tiêu thụ năng lượng hôm nay
            var today = DateTime.UtcNow.Date;
            var todayConsumption = await GetTodayConsumptionAsync(userId);
            stats.Add(new Stat
            {
                Id = "1",
                Title = "Tiêu thụ hôm nay",
                Value = todayConsumption,
                Unit = "kWh",
                Change = 5, // Giả lập
                ChangeType = todayConsumption > 0 ? "increase" : "decrease",
                Icon = "energy"
            });

            // Tổng tiêu thụ tháng này
            var monthlyConsumption = await GetMonthlyConsumptionAsync(userId);
            stats.Add(new Stat
            {
                Id = "2",
                Title = "Tiêu thụ tháng này",
                Value = monthlyConsumption,
                Unit = "kWh",
                Change = 12, // Giả lập
                ChangeType = "increase",
                Icon = "calendar"
            });

            // Thiết bị đang hoạt động
            var activeDevicesCount = await GetActiveDevicesCountAsync(userId);
            stats.Add(new Stat
            {
                Id = "3",
                Title = "Thiết bị đang hoạt động",
                Value = activeDevicesCount,
                Unit = "",
                Change = 2, // Giả lập
                ChangeType = "increase",
                Icon = "device"
            });

            // Dự tính tiền điện
            var estimatedBill = CalculateEstimatedBill(monthlyConsumption);
            stats.Add(new Stat
            {
                Id = "4",
                Title = "Dự tính tiền điện",
                Value = estimatedBill,
                Unit = "VND",
                Change = 8, // Giả lập
                ChangeType = "increase",
                Icon = "money"
            });

            return stats;
        }

        // Lấy thống kê nhanh
        public async Task<List<Stat>> GetQuickStatsForUserAsync(string userId)
        {
            // Trong thực tế, bạn có thể gọi phương thức GetStatsForUserAsync hoặc triển khai logic khác
            return await GetStatsForUserAsync(userId);
        }

        // Lấy cảnh báo cho người dùng
        public async Task<List<Alert>> GetAlertsForUserAsync(string userId)
        {
            var filter = Builders<Alert>.Filter.Eq(a => a.UserId, userId);
            return await _alertsCollection.Find(filter).ToListAsync();
        }

        // Lấy cảnh báo chưa đọc
        public async Task<List<Alert>> GetUnreadAlertsForUserAsync(string userId)
        {
            var filter = Builders<Alert>.Filter.And(
                Builders<Alert>.Filter.Eq(a => a.UserId, userId),
                Builders<Alert>.Filter.Eq(a => a.Read, false)
            );
            return await _alertsCollection.Find(filter).ToListAsync();
        }

        // Đánh dấu cảnh báo đã đọc
        public async Task<bool> MarkAlertAsReadAsync(string alertId, string userId)
        {
            var filter = Builders<Alert>.Filter.And(
                Builders<Alert>.Filter.Eq(a => a.Id, alertId),
                Builders<Alert>.Filter.Eq(a => a.UserId, userId)
            );
            var update = Builders<Alert>.Update.Set(a => a.Read, true);
            var result = await _alertsCollection.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        // Phương thức helper
        private async Task<double> GetTodayConsumptionAsync(string userId)
        {
            var today = DateTime.UtcNow.Date;
            var filter = Builders<EnergyConsumption>.Filter.And(
                Builders<EnergyConsumption>.Filter.Eq(e => e.UserId, userId),
                Builders<EnergyConsumption>.Filter.Gte(e => e.Date, today),
                Builders<EnergyConsumption>.Filter.Lt(e => e.Date, today.AddDays(1))
            );
            var consumptions = await _energyCollection.Find(filter).ToListAsync();
            return consumptions.Sum(c => c.Value);
        }

        private async Task<double> GetMonthlyConsumptionAsync(string userId)
        {
            var firstDayOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var filter = Builders<EnergyConsumption>.Filter.And(
                Builders<EnergyConsumption>.Filter.Eq(e => e.UserId, userId),
                Builders<EnergyConsumption>.Filter.Gte(e => e.Date, firstDayOfMonth),
                Builders<EnergyConsumption>.Filter.Lt(e => e.Date, firstDayOfMonth.AddMonths(1))
            );
            var consumptions = await _energyCollection.Find(filter).ToListAsync();
            return consumptions.Sum(c => c.Value);
        }

        private async Task<int> GetActiveDevicesCountAsync(string userId)
        {
            var filter = Builders<Device>.Filter.And(
                Builders<Device>.Filter.Eq(d => d.UserId, userId),
                Builders<Device>.Filter.Eq(d => d.Status, "on")
            );
            return (int)await _devicesCollection.CountDocumentsAsync(filter);
        }

        private double CalculateEstimatedBill(double consumption)
        {
            // Giả lập tính tiền điện dựa trên mức tiêu thụ
            const double baseCost = 1700; // VND/kWh
            return consumption * baseCost;
        }
    }
}
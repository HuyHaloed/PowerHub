using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MongoDB.Bson;
using MyIoTPlatform.API.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MyIoTPlatform.API.Controllers;


namespace MyIoTPlatform.API.Services
{
    public class MongoDbService
    {
        private readonly IMongoCollection<User> _usersCollection;
        private readonly IMongoCollection<SensorReading> _sensorReadingsCollection;
        private readonly IMongoCollection<DeviceSchedule> _schedulesCollection;
        private readonly IMongoCollection<DeviceThreshold> _thresholdsCollection;
          private readonly IMongoCollection<Device> _devicesCollection;
        private readonly IMongoCollection<Alert> _alertsCollection;
        private readonly ILogger<MongoDbService> _logger;


        private readonly IMongoCollection<EnergyConsumption> _energyConsumptionCollection;
        private readonly IMongoCollection<Notification> _notificationsCollection;
        private readonly IMongoCollection<Session> _sessionsCollection;
        private readonly IMongoCollection<EnergyDistribution> _energyDistributionCollection;
        private readonly IMongoCollection<EnvironmentData> _environmentDataCollection;

        public MongoDbService(IOptions<MongoDbSettings> mongoDbSettings)
        {
            var mongoClient = new MongoClient(mongoDbSettings.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(mongoDbSettings.Value.DatabaseName);

            _usersCollection = mongoDatabase.GetCollection<User>("Users");
            _devicesCollection = mongoDatabase.GetCollection<Device>("Devices");
            _energyConsumptionCollection = mongoDatabase.GetCollection<EnergyConsumption>("EnergyConsumption");
            _alertsCollection = mongoDatabase.GetCollection<Alert>("Alerts");
            _notificationsCollection = mongoDatabase.GetCollection<Notification>("Notifications");
            _sessionsCollection = mongoDatabase.GetCollection<Session>("Sessions");
            _energyDistributionCollection = mongoDatabase.GetCollection<EnergyDistribution>("EnergyDistribution");
            _environmentDataCollection = mongoDatabase.GetCollection<EnvironmentData>("EnvironmentData");
            _thresholdsCollection = mongoDatabase.GetCollection<DeviceThreshold>("DeviceThresholds");
            _sensorReadingsCollection = mongoDatabase.GetCollection<SensorReading>("SensorReadings");

            // Thêm collection mới cho lịch trình
            _schedulesCollection = mongoDatabase.GetCollection<DeviceSchedule>("DeviceSchedules");
        }
        

        #region User Operations
        public async Task<DeviceSchedule> GetScheduleByDeviceIdAsync(string deviceId)
        {
            return await _schedulesCollection.Find(s => s.DeviceId == deviceId).FirstOrDefaultAsync();
        }

        // Lấy tất cả lịch trình cho một danh sách thiết bị
        public async Task<List<DeviceSchedule>> GetSchedulesByDeviceIdsAsync(List<string> deviceIds)
        {
            var filter = Builders<DeviceSchedule>.Filter.In(s => s.DeviceId, deviceIds);
            return await _schedulesCollection.Find(filter).ToListAsync();
        }

        // Lấy tất cả lịch trình đang hoạt động
        public async Task<List<DeviceSchedule>> GetAllActiveSchedulesAsync()
        {
            return await _schedulesCollection.Find(s => s.IsActive).ToListAsync();
        }

        // Tạo lịch trình mới
        public async Task CreateScheduleAsync(DeviceSchedule schedule)
        {
            await _schedulesCollection.InsertOneAsync(schedule);
        }

        // Cập nhật lịch trình
        public async Task UpdateScheduleAsync(string id, DeviceSchedule updatedSchedule)
        {
            await _schedulesCollection.ReplaceOneAsync(s => s.Id == id, updatedSchedule);
        }

        // Xóa lịch trình
        public async Task<bool> DeleteScheduleAsync(string deviceId)
        {
            var result = await _schedulesCollection.DeleteOneAsync(s => s.DeviceId == deviceId);
            return result.DeletedCount > 0;
        }

        // Cập nhật trạng thái kích hoạt của lịch trình
        public async Task<bool> UpdateScheduleActiveStatusAsync(string deviceId, bool isActive)
        {
            var filter = Builders<DeviceSchedule>.Filter.Eq(s => s.DeviceId, deviceId);
            var update = Builders<DeviceSchedule>.Update
                .Set(s => s.IsActive, isActive)
                .Set(s => s.UpdatedAt, DateTime.UtcNow);
                
            var result = await _schedulesCollection.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<User> GetUserByIdAsync(string id)
        {
            return await _usersCollection.Find(u => u.Id == id).FirstOrDefaultAsync();
        }

        public async Task<User> GetUserByEmailAsync(string email)
        {
            return await _usersCollection.Find(u => u.Email == email).FirstOrDefaultAsync();
        }

        public async Task<User> CreateUserAsync(User user)
        {
            await _usersCollection.InsertOneAsync(user);
            return user;
        }

        public async Task UpdateUserAsync(string id, User updatedUser)
        {
            await _usersCollection.ReplaceOneAsync(u => u.Id == id, updatedUser);
        }

        public async Task UpdateUserPreferencesAsync(string id, UserPreferences preferences)
        {
            var filter = Builders<User>.Filter.Eq(u => u.Id, id);
            var update = Builders<User>.Update.Set(u => u.Preferences, preferences);
            await _usersCollection.UpdateOneAsync(filter, update);
        }

        public async Task UpdateUserSubscriptionAsync(string id, UserSubscription subscription)
        {
            var filter = Builders<User>.Filter.Eq(u => u.Id, id);
            var update = Builders<User>.Update.Set(u => u.Subscription, subscription);
            await _usersCollection.UpdateOneAsync(filter, update);
        }

        public async Task AddPaymentHistoryAsync(string userId, PaymentHistory payment)
        {
            var user = await GetUserByIdAsync(userId);
            user.Subscription.PaymentHistory.Add(payment);
            await UpdateUserAsync(userId, user);
        }

        public async Task UpdatePaymentMethodAsync(string userId, PaymentMethod paymentMethod)
        {
            var user = await GetUserByIdAsync(userId);
            user.Subscription.PaymentMethod = paymentMethod;
            await UpdateUserAsync(userId, user);
        }

        public async Task UpdateTwoFactorAuthenticationAsync(string userId, bool enabled, string secret = "")
        {
            var filter = Builders<User>.Filter.Eq(u => u.Id, userId);
            var update = Builders<User>.Update
                .Set(u => u.TwoFactorEnabled, enabled)
                .Set(u => u.TwoFactorSecret, secret);
            await _usersCollection.UpdateOneAsync(filter, update);
        }
        
        public async Task<List<User>> GetAllUsersAsync()
        {
            var filter = Builders<User>.Filter.Empty;
            return await _usersCollection.Find(filter).ToListAsync();
        }
        #endregion

        #region ADMIN
        public async Task<DeviceStatisticsDto> GetDeviceStatisticsAsync(string userId)
        {
            // Get all devices for the user
            var devices = await GetDevicesByUserIdAsync(userId);
            
            // Get active devices
            var activeDevices = devices.Where(d => d.Status == "on").ToList();
            
            // Calculate device type distribution
            var deviceTypeDistribution = devices
                .GroupBy(d => d.Type)
                .Select(g => new DeviceTypeDistributionItem
                {
                    Type = g.Key,
                    Count = g.Count(),
                    Percentage = Math.Round((double)g.Count() / devices.Count * 100, 1)
                })
                .ToList();

            // Calculate total energy consumption (you might want to use EnergyService for more precise calculation)
            double totalEnergyConsumption = devices.Sum(d => d.Consumption);

            return new DeviceStatisticsDto
            {
                TotalDevices = devices.Count,
                ActiveDevices = activeDevices.Count,
                TotalEnergyConsumption = Math.Round(totalEnergyConsumption, 1),
                AverageDeviceUptime = Math.Round(activeDevices.Count / (double)devices.Count * 100, 1),
                DeviceTypeDistribution = deviceTypeDistribution
            };
        }

        // DTOs to represent the response
        public class DeviceStatisticsDto
        {
            public int TotalDevices { get; set; }
            public int ActiveDevices { get; set; }
            public double TotalEnergyConsumption { get; set; }
            public double AverageDeviceUptime { get; set; }
            public List<DeviceTypeDistributionItem> DeviceTypeDistribution { get; set; }
        }

        public class DeviceTypeDistributionItem
        {
            public string Type { get; set; }
            public int Count { get; set; }
            public double Percentage { get; set; }
        }
        #endregion


        #region Device Operations
        public async Task<List<Device>> GetAllDevicesAsync(string status = null, string location = null, string type = null, string search = null)
        {
            var filter = Builders<Device>.Filter.Empty;

            if (!string.IsNullOrEmpty(status))
                filter &= Builders<Device>.Filter.Eq(d => d.Status, status);

            if (!string.IsNullOrEmpty(location))
                filter &= Builders<Device>.Filter.Eq(d => d.Location, location);

            if (!string.IsNullOrEmpty(type))
                filter &= Builders<Device>.Filter.Eq(d => d.Type, type);

            if (!string.IsNullOrEmpty(search))
                filter &= Builders<Device>.Filter.Regex(d => d.Name, new BsonRegularExpression(search, "i"));

            return await _devicesCollection.Find(filter).ToListAsync();
        }
        public async Task<bool> UserHasDeviceAccessAsync(string userId, string deviceId)
        {
            var device = await GetDeviceByIdAsync(deviceId);
            return device != null && device.UserIds.Contains(userId);
        }

        public async Task RemoveDeviceAccessAsync(string deviceId, string userId)
        {
            var device = await GetDeviceByIdAsync(deviceId);
            if (device != null)
            {
                device.UserIds.Remove(userId);
                await UpdateDeviceAsync(deviceId, device);
            }
        }

        public async Task<List<Device>> GetDevicesByUserIdAsync(string userId, string status = null, string location = null, string type = null, string search = null)
        {
            var filter = Builders<Device>.Filter.AnyEq(d => d.UserIds, userId);

            if (!string.IsNullOrEmpty(status))
                filter &= Builders<Device>.Filter.Eq(d => d.Status, status);

            if (!string.IsNullOrEmpty(location))
                filter &= Builders<Device>.Filter.Eq(d => d.Location, location);

            if (!string.IsNullOrEmpty(type))
                filter &= Builders<Device>.Filter.Eq(d => d.Type, type);

            if (!string.IsNullOrEmpty(search))
                filter &= Builders<Device>.Filter.Regex(d => d.Name, new BsonRegularExpression(search, "i"));

            return await _devicesCollection.Find(filter).ToListAsync();
        }
        public async Task<DeviceThreshold> GetDeviceThresholdAsync(string deviceId)
        {
            return await _thresholdsCollection.Find(t => t.DeviceId == deviceId).FirstOrDefaultAsync();
        }

        public async Task<DeviceThreshold> SetDeviceThresholdAsync(DeviceThreshold threshold)
        {
            var existingThreshold = await GetDeviceThresholdAsync(threshold.DeviceId);
            
            if (existingThreshold != null)
            {
                threshold.Id = existingThreshold.Id;
                threshold.CreatedAt = existingThreshold.CreatedAt;
                threshold.UpdatedAt = DateTime.UtcNow;
                
                await _thresholdsCollection.ReplaceOneAsync(t => t.Id == existingThreshold.Id, threshold);
                return threshold;
            }
            
            threshold.CreatedAt = DateTime.UtcNow;
            threshold.UpdatedAt = DateTime.UtcNow;
            await _thresholdsCollection.InsertOneAsync(threshold);
            return threshold;
        }

        public async Task<bool> CheckAndApplyThresholdAsync(string deviceId, double consumption)
        {
            var threshold = await GetDeviceThresholdAsync(deviceId);
            
            if (threshold == null || !threshold.IsEnabled)
                return false;
            
            var device = await GetDeviceByIdAsync(deviceId);
            if (device == null)
                return false;
            
            bool shouldApplyAction = false;
            
            if (threshold.Action == "turnOff" && consumption >= threshold.Value)
            {
                shouldApplyAction = true;
            }
            else if (threshold.Action == "turnOn" && consumption <= threshold.Value)
            {
                shouldApplyAction = true;
            }
            
            if (shouldApplyAction)
            {
                string newStatus = threshold.Action == "turnOff" ? "OFF" : "ON";
                
                // Only change status if it's different
                if (device.Status != newStatus)
                {
                    await ControlDeviceAsync(deviceId, newStatus);
                    return true;
                }
            }
            
            return false;
        }

        public async Task<List<Device>> GetActiveDevicesAsync()
        {
            return await _devicesCollection.Find(d => d.Status == "on").ToListAsync();
        }

        public async Task<List<Device>> GetActiveDevicesByUserIdAsync(string userId)
        {
            return await _devicesCollection.Find(d => d.UserIds.Contains(userId) && d.Status == "on").ToListAsync();
        }

        public async Task<Device> GetDeviceByIdAsync(string id)
        {
            return await _devicesCollection.Find(d => d.Id == id).FirstOrDefaultAsync();
        }

        public async Task CreateDeviceAsync(Device device)
        {
            await _devicesCollection.InsertOneAsync(device);
        }

        public async Task UpdateDeviceAsync(string id, Device updatedDevice)
        {
            await _devicesCollection.ReplaceOneAsync(d => d.Id == id, updatedDevice);
        }

        public async Task DeleteDeviceAsync(string id)
        {
            await _devicesCollection.DeleteOneAsync(d => d.Id == id);
        }

        public async Task<Device> ControlDeviceAsync(string id, string status)
        {
            string normalizedStatus = status.ToUpper();
            
            var update = Builders<Device>.Update
                .Set(d => d.Status, normalizedStatus)
                .Set(d => d.LastUpdated, DateTime.UtcNow)
                .Push(d => d.History, new DeviceHistory 
                {
                    Timestamp = DateTime.UtcNow,
                    Status = normalizedStatus,
                    Consumption = normalizedStatus == "ON" ? GetRandomConsumption() : 0
                });

            return await _devicesCollection.FindOneAndUpdateAsync(
                d => d.Id == id,
                update,
                new FindOneAndUpdateOptions<Device> { ReturnDocument = ReturnDocument.After }
            );
        }

        private double GetRandomConsumption()
        {
            Random random = new Random();
            return Math.Round(random.NextDouble() * 100, 2);
        }

        public async Task<Device> GetDeviceByNameAndUserIdAsync(string name, string userId)
        {
            return await _devicesCollection.Find(d => d.Name == name && d.UserIds.Contains(userId)).FirstOrDefaultAsync();
        }
        #endregion

        #region Energy Consumption Operations
        public async Task<List<EnergyConsumption>> GetEnergyConsumptionAsync(string userId, string timeRange, DateTime? startDate = null, DateTime? endDate = null)
        {
            var filter = Builders<EnergyConsumption>.Filter.Eq(e => e.UserId, userId);

            if (!string.IsNullOrEmpty(timeRange))
                filter &= Builders<EnergyConsumption>.Filter.Eq(e => e.TimeRange, timeRange);

            if (startDate.HasValue)
                filter &= Builders<EnergyConsumption>.Filter.Gte(e => e.Date, startDate.Value);

            if (endDate.HasValue)
                filter &= Builders<EnergyConsumption>.Filter.Lte(e => e.Date, endDate.Value);

            return await _energyConsumptionCollection.Find(filter).SortBy(e => e.Date).ToListAsync();
        }

        public async Task<List<EnergyDistribution>> GetAllDistributionsForUserAsync(string userId, DateTime startDate, DateTime endDate)
        {
            var devices = await GetDevicesByUserIdAsync(userId);
            
            if (devices.Count == 0)
                return new List<EnergyDistribution>();
            
            var deviceIds = devices.Select(d => d.Id).ToList();
            
            var filter = Builders<EnergyDistribution>.Filter.And(
                Builders<EnergyDistribution>.Filter.Eq(e => e.UserId, userId),
                Builders<EnergyDistribution>.Filter.In(e => e.DeviceId, deviceIds),
                Builders<EnergyDistribution>.Filter.Gte(e => e.Date, startDate),
                Builders<EnergyDistribution>.Filter.Lte(e => e.Date, endDate)
            );
            
            var allDistributions = await _energyDistributionCollection.Find(filter)
                .Sort(Builders<EnergyDistribution>.Sort.Ascending(e => e.Date))
                .ToListAsync();
            
            return allDistributions;
        }


        public async Task<List<EnergyDistribution>> GetHourlyDistributionsForDayAsync(string userId, DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1).AddTicks(-1);
            
            return await GetAllDistributionsForPeriodAsync(userId, startDate, endDate);
        }

        public async Task<List<EnergyConsumption>> GetEnergyConsumptionByDevicesAsync(string userId, string timeRange, DateTime? startDate = null, DateTime? endDate = null)
        {
            var filter = Builders<EnergyConsumption>.Filter.Eq(e => e.UserId, userId);

            if (!string.IsNullOrEmpty(timeRange))
                filter &= Builders<EnergyConsumption>.Filter.Eq(e => e.TimeRange, timeRange);

            if (startDate.HasValue)
                filter &= Builders<EnergyConsumption>.Filter.Gte(e => e.Date, startDate.Value);

            if (endDate.HasValue)
                filter &= Builders<EnergyConsumption>.Filter.Lte(e => e.Date, endDate.Value);

            filter &= Builders<EnergyConsumption>.Filter.Ne(e => e.DeviceId, null);

            return await _energyConsumptionCollection.Find(filter).SortBy(e => e.Date).ToListAsync();
        }
        public async Task<List<EnergyDistribution>> GetAllDistributionsForDayAsync(string userId, DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1).AddTicks(-1);
            
            return await GetAllDistributionsForPeriodAsync(userId, startDate, endDate);
        }
        public async Task<List<EnergyDistribution>> GetAllDistributionsForPeriodAsync(string userId, DateTime startDate, DateTime endDate)
        {
            var devices = await GetDevicesByUserIdAsync(userId);
            if (devices.Count == 0)
                return new List<EnergyDistribution>();
            
            var deviceIds = devices.Select(d => d.Id).ToList();
            var filter = Builders<EnergyDistribution>.Filter.And(
                Builders<EnergyDistribution>.Filter.Eq(e => e.UserId, userId),
                Builders<EnergyDistribution>.Filter.In(e => e.DeviceId, deviceIds),
                Builders<EnergyDistribution>.Filter.Gte(e => e.Date, startDate),
                Builders<EnergyDistribution>.Filter.Lte(e => e.Date, endDate)
            );
            var distributions = await _energyDistributionCollection.Find(filter)
                .Sort(Builders<EnergyDistribution>.Sort.Ascending(e => e.Date))
                .ToListAsync();
            
            return distributions;
        }

        public async Task<List<EnergyDistribution>> CalculateEnergyDistributionAsync(string userId, DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1).AddTicks(-1);
            var devices = await GetDevicesByUserIdAsync(userId);
            var deviceConsumptions = new List<(string DeviceId, string DeviceName, double Consumption)>();
            foreach (var device in devices)
            {
                var consumption = await GetEnergyConsumptionByDeviceAsync(userId, device.Id, "day", startDate, endDate);
                double totalConsumption = consumption.Sum(c => c.Value);
                deviceConsumptions.Add((device.Id, device.Name, totalConsumption));
            }
            double totalAllConsumption = deviceConsumptions.Sum(dc => dc.Consumption);
            if (totalAllConsumption <= 0)
                return new List<EnergyDistribution>();
            
            var colors = new[] { "#4CAF50", "#2196F3", "#FFC107", "#9C27B0", "#F44336", "#607D8B" };
            var result = new List<EnergyDistribution>();
            for (int i = 0; i < deviceConsumptions.Count; i++)
            {
                var (deviceId, deviceName, consumption) = deviceConsumptions[i];
                double percentage = (consumption / totalAllConsumption) * 100;
                result.Add(new EnergyDistribution
                {
                    UserId = userId,
                    DeviceId = deviceId,
                    Name = deviceName,
                    Value = Math.Round(percentage, 1),
                    Color = colors[i % colors.Length],
                    Date = date
                });
            }
            
            return result;
        }
        public async Task<List<EnergyDistribution>> GetEnergyDistributionByDeviceAsync(
            string userId, string deviceId, DateTime startDate, DateTime endDate)
        {
            var filter = Builders<EnergyDistribution>.Filter.Eq(e => e.UserId, userId)
                & Builders<EnergyDistribution>.Filter.Eq(e => e.DeviceId, deviceId)
                & Builders<EnergyDistribution>.Filter.Gte(e => e.Date, startDate)
                & Builders<EnergyDistribution>.Filter.Lte(e => e.Date, endDate);

            return await _energyDistributionCollection.Find(filter).ToListAsync();
        }
        public async Task<List<EnergyConsumption>> GetEnergyConsumptionByTimeRangeAsync(string userId, string timeRange, DateTime startDate, DateTime endDate)
        {
            var filter = Builders<EnergyConsumption>.Filter.Eq(e => e.UserId, userId)
                & Builders<EnergyConsumption>.Filter.Eq(e => e.TimeRange, timeRange)
                & Builders<EnergyConsumption>.Filter.Gte(e => e.Date, startDate)
                & Builders<EnergyConsumption>.Filter.Lte(e => e.Date, endDate);

            return await _energyConsumptionCollection.Find(filter).ToListAsync();
        }

        public async Task<List<EnergyConsumption>> GetEnergyConsumptionByDeviceAsync(string userId, string deviceId, string timeRange, DateTime? startDate = null, DateTime? endDate = null)
        {
            var filter = Builders<EnergyConsumption>.Filter.Eq(e => e.UserId, userId) 
                & Builders<EnergyConsumption>.Filter.Eq(e => e.DeviceId, deviceId);

            if (!string.IsNullOrEmpty(timeRange))
                filter &= Builders<EnergyConsumption>.Filter.Eq(e => e.TimeRange, timeRange);

            if (startDate.HasValue)
                filter &= Builders<EnergyConsumption>.Filter.Gte(e => e.Date, startDate.Value);

            if (endDate.HasValue)
                filter &= Builders<EnergyConsumption>.Filter.Lte(e => e.Date, endDate.Value);

            return await _energyConsumptionCollection.Find(filter).SortBy(e => e.Date).ToListAsync();
        }

        public async Task AddEnergyConsumptionAsync(EnergyConsumption energyConsumption)
        {
            await _energyConsumptionCollection.InsertOneAsync(energyConsumption);
        }

        public async Task<List<EnergyDistribution>> GetEnergyDistributionAsync(string userId, DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1).AddTicks(-1);

            var filter = Builders<EnergyDistribution>.Filter.Eq(e => e.UserId, userId)
                & Builders<EnergyDistribution>.Filter.Gte(e => e.Date, startDate)
                & Builders<EnergyDistribution>.Filter.Lte(e => e.Date, endDate);

            return await _energyDistributionCollection.Find(filter).ToListAsync();
        }

        public async Task AddEnergyDistributionAsync(EnergyDistribution energyDistribution)
        {
            await _energyDistributionCollection.InsertOneAsync(energyDistribution);
        }
        #endregion

        #region Alert Operations
        public async Task<List<Alert>> GetAlertsForUserAsync(string userId)
        {
            return await _alertsCollection.Find(a => a.UserId == userId).SortByDescending(a => a.Date).ToListAsync();
        }

        public async Task<List<Alert>> GetUnreadAlertsForUserAsync(string userId)
        {
            return await _alertsCollection.Find(a => a.UserId == userId && !a.Read).SortByDescending(a => a.Date).ToListAsync();
        }

        public async Task AddAlertAsync(Alert alert)
        {
            await _alertsCollection.InsertOneAsync(alert);
        }

        public async Task<bool> MarkAlertAsReadAsync(string id, string userId)
        {
            var filter = Builders<Alert>.Filter.Eq(a => a.Id, id) & Builders<Alert>.Filter.Eq(a => a.UserId, userId);
            var update = Builders<Alert>.Update.Set(a => a.Read, true);
            var result = await _alertsCollection.UpdateOneAsync(filter, update);

            return result.ModifiedCount > 0;
        }
        #endregion

        #region Notification Operations
        public async Task<List<Notification>> GetNotificationsForUserAsync(string userId, int page, int limit, bool? read = null)
        {
            var filter = Builders<Notification>.Filter.Eq(n => n.UserId, userId);

            if (read.HasValue)
                filter &= Builders<Notification>.Filter.Eq(n => n.Read, read.Value);

            return await _notificationsCollection.Find(filter)
                .SortByDescending(n => n.Date)
                .Skip((page - 1) * limit)
                .Limit(limit)
                .ToListAsync();
        }

        public async Task<long> GetNotificationCountForUserAsync(string userId, bool? read = null)
        {
            var filter = Builders<Notification>.Filter.Eq(n => n.UserId, userId);

            if (read.HasValue)
                filter &= Builders<Notification>.Filter.Eq(n => n.Read, read.Value);

            return await _notificationsCollection.CountDocumentsAsync(filter);
        }

        public async Task AddNotificationAsync(Notification notification)
        {
            await _notificationsCollection.InsertOneAsync(notification);
        }

        public async Task MarkNotificationAsReadAsync(string id)
        {
            var filter = Builders<Notification>.Filter.Eq(n => n.Id, id);
            var update = Builders<Notification>.Update.Set(n => n.Read, true);
            await _notificationsCollection.UpdateOneAsync(filter, update);
        }

        public async Task MarkAllNotificationsAsReadAsync(string userId)
        {
            var filter = Builders<Notification>.Filter.Eq(n => n.UserId, userId) & Builders<Notification>.Filter.Eq(n => n.Read, false);
            var update = Builders<Notification>.Update.Set(n => n.Read, true);
            await _notificationsCollection.UpdateManyAsync(filter, update);
        }

        public async Task DeleteNotificationAsync(string id)
        {
            await _notificationsCollection.DeleteOneAsync(n => n.Id == id);
        }
        #endregion

        #region Session Operations
        public async Task<List<Session>> GetActiveSessionsForUserAsync(string userId)
        {
            return await _sessionsCollection.Find(s => s.UserId == userId).ToListAsync();
        }

        public async Task AddSessionAsync(Session session)
        {
            await _sessionsCollection.InsertOneAsync(session);
        }

        public async Task RevokeSessionAsync(string id)
        {
            await _sessionsCollection.DeleteOneAsync(s => s.Id == id);
        }
        #endregion
        
        #region Environment Data Operations
        
        public async Task<EnvironmentData> AddEnvironmentDataAsync(EnvironmentData data)
        {
            await _environmentDataCollection.InsertOneAsync(data);
            return data;
        }

        public async Task<List<EnvironmentData>> GetEnvironmentDataForUserAsync(
            string userId, 
            DateTime? startDate = null, 
            DateTime? endDate = null,
            string deviceId = null)
        {
            var builder = Builders<EnvironmentData>.Filter;
            var filter = builder.Eq(e => e.UserId, userId);

            if (startDate.HasValue)
                filter &= builder.Gte(e => e.Timestamp, startDate.Value);

            if (endDate.HasValue)
                filter &= builder.Lte(e => e.Timestamp, endDate.Value);

            // if (!string.IsNullOrEmpty(deviceId))
            //     filter &= builder.Eq(e => e.DeviceId, deviceId);

            return await _environmentDataCollection
                .Find(filter)
                .SortByDescending(e => e.Timestamp)
                .ToListAsync();
        }

        public async Task<EnvironmentData> GetLatestEnvironmentDataForUserAsync(string userId, string deviceId = null)
        {
            var builder = Builders<EnvironmentData>.Filter;
            var filter = builder.Eq(e => e.UserId, userId);

            // if (!string.IsNullOrEmpty(deviceId))
            //     filter &= builder.Eq(e => e.DeviceId, deviceId);

            return await _environmentDataCollection
                .Find(filter)
                .SortByDescending(e => e.Timestamp)
                .FirstOrDefaultAsync();
        }

        public async Task<List<string>> GetEnvironmentDataLocationsAsync(string userId)
        {
            var data = await GetEnvironmentDataForUserAsync(userId);
            return data.Select(d => d.Location).Distinct().ToList();
        }

        public async Task<EnvironmentStatsDto> GetEnvironmentStatsForUserAsync(
            string userId, 
            DateTime? startDate = null, 
            DateTime? endDate = null,
            string location = null)
        {
            var data = await GetEnvironmentDataForUserAsync(userId, startDate, endDate);
            
            // Lọc theo vị trí nếu được chỉ định
            if (!string.IsNullOrEmpty(location))
            {
                data = data.Where(d => d.Location.Equals(location, StringComparison.OrdinalIgnoreCase)).ToList();
            }
            
            if (data == null || !data.Any())
            {
                return new EnvironmentStatsDto 
                { 
                    HasData = false 
                };
            }

            var latestData = data.OrderByDescending(d => d.Timestamp).First();
            
            return new EnvironmentStatsDto
            {
                CurrentTemperature = latestData.Temperature,
                CurrentHumidity = latestData.Humidity,
                AvgTemperature = Math.Round(data.Average(d => d.Temperature), 1),
                AvgHumidity = Math.Round(data.Average(d => d.Humidity), 1),
                MaxTemperature = Math.Round(data.Max(d => d.Temperature), 1),
                MinTemperature = Math.Round(data.Min(d => d.Temperature), 1),
                MaxHumidity = Math.Round(data.Max(d => d.Humidity), 1),
                MinHumidity = Math.Round(data.Min(d => d.Humidity), 1),
                LastUpdated = latestData.Timestamp,
                Location = latestData.Location,
                HasData = true
            };
        }

        public async Task<bool> DeleteEnvironmentDataAsync(string id, string userId)
        {
            var filter = Builders<EnvironmentData>.Filter.Eq(e => e.Id, id) & 
                        Builders<EnvironmentData>.Filter.Eq(e => e.UserId, userId);
            
            var result = await _environmentDataCollection.DeleteOneAsync(filter);
            return result.DeletedCount > 0;
        }

        public async Task<bool> HasEnvironmentDataSubscriptionAsync(string userId)
        {
            var user = await GetUserByIdAsync(userId);
            
            // Mọi người dùng đều có thể sử dụng tính năng này trong ví dụ này
            return user != null;
        }

        internal async Task CreateScheduleAsync(ScheduleDbModel dbScheduleData)
        {
            throw new NotImplementedException();
        }


        #endregion


        public async Task<Alert> GetAlertByIdAsync(string alertId)
        {
            try
            {
                var filter = Builders<Alert>.Filter.Eq("_id", ObjectId.Parse(alertId));
                return await _alertsCollection.Find(filter).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy cảnh báo theo ID {AlertId}", alertId);
                return null;
            }
        }

        // // Thêm một cảnh báo mới
        // public async Task<string> AddAlertAsync(Alert alert)
        // {
        //     try
        //     {
        //         await _alertsCollection.InsertOneAsync(alert);
        //         return alert.Id.ToString();
        //     }
        //     catch (Exception ex)
        //     {
        //         _logger.LogError(ex, "Lỗi khi thêm cảnh báo mới");
        //         return null;
        //     }
        // }

        // Xóa một cảnh báo
        public async Task<bool> DeleteAlertAsync(string alertId)
        {
            try
            {
                var filter = Builders<Alert>.Filter.Eq("_id", ObjectId.Parse(alertId));
                var result = await _alertsCollection.DeleteOneAsync(filter);
                return result.DeletedCount > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xóa cảnh báo {AlertId}", alertId);
                return false;
            }
        }

        // Xóa tất cả cảnh báo của một người dùng
        public async Task<bool> DeleteAllUserAlertsAsync(string userId)
        {
            try
            {
                var filter = Builders<Alert>.Filter.Eq(a => a.UserId, userId);
                var result = await _alertsCollection.DeleteManyAsync(filter);
                return result.DeletedCount > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xóa tất cả cảnh báo của người dùng {UserId}", userId);
                return false;
            }
        }
        public async Task AddSensorReadingAsync(SensorReading reading)
        {
            await _sensorReadingsCollection.InsertOneAsync(reading);
        }

        public async Task<List<SensorReading>> GetSensorReadingsForUserAsync(
            string userId, 
            string feedName,
            DateTime? startDate = null,
            DateTime? endDate = null)
        {
            var filter = Builders<SensorReading>.Filter.Eq(r => r.UserId, userId);
            
            if (!string.IsNullOrEmpty(feedName))
                filter &= Builders<SensorReading>.Filter.Eq(r => r.FeedName, feedName);
            
            if (startDate.HasValue)
                filter &= Builders<SensorReading>.Filter.Gte(r => r.Timestamp, startDate.Value);
            
            if (endDate.HasValue)
                filter &= Builders<SensorReading>.Filter.Lte(r => r.Timestamp, endDate.Value);
            
            return await _sensorReadingsCollection.Find(filter)
                .SortByDescending(r => r.Timestamp)
                .ToListAsync();
        }

        public async Task<SensorReading> GetLatestSensorReadingForUserAsync(string userId, string feedName)
        {
            var filter = Builders<SensorReading>.Filter.Eq(r => r.UserId, userId);
            
            if (!string.IsNullOrEmpty(feedName))
                filter &= Builders<SensorReading>.Filter.Eq(r => r.FeedName, feedName);
            
            return await _sensorReadingsCollection.Find(filter)
                .SortByDescending(r => r.Timestamp)
                .FirstOrDefaultAsync();
        }
    }

    public class MongoDbSettings
    {
        public string ConnectionString { get; set; } = string.Empty;
        public string DatabaseName { get; set; } = string.Empty;
    }
    
    public class TokenService
    {
        private readonly IConfiguration _configuration;

        public TokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateJwtToken(User user)
        {
            var tokenKey = _configuration["Jwt:Key"];
            if (string.IsNullOrEmpty(tokenKey))
                throw new InvalidOperationException("JWT key is not configured");

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Role, user.role) // vướng r vs R mà mệt mỏi
            };
            claims.Add(new Claim("plan", user.Subscription.Plan));
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
        
        
    }

    


    
    
}
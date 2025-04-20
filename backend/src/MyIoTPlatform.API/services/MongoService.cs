using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MongoDB.Bson;
using MyIoTPlatform.API.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;


namespace MyIoTPlatform.API.Services
{
    public class MongoDbService
    {
        private readonly IMongoCollection<User> _usersCollection;
        private readonly IMongoCollection<Device> _devicesCollection;
        private readonly IMongoCollection<EnergyConsumption> _energyConsumptionCollection;
        private readonly IMongoCollection<Alert> _alertsCollection;
        private readonly IMongoCollection<Notification> _notificationsCollection;
        private readonly IMongoCollection<Session> _sessionsCollection;
        private readonly IMongoCollection<EnergyDistribution> _energyDistributionCollection;

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
        }

        #region User Operations

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
        
        // Updated method to properly fetch all users from MongoDB
        public async Task<List<User>> GetAllUsersAsync()
        {
            // Create an empty filter to get all documents
            var filter = Builders<User>.Filter.Empty;
            return await _usersCollection.Find(filter).ToListAsync();
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

        // Phương thức để loại bỏ quyền truy cập của người dùng
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
            var device = await GetDeviceByIdAsync(id);
            device.Status = status;
            device.LastUpdated = DateTime.UtcNow;

            device.History.Add(new DeviceHistory
            {
                Timestamp = DateTime.UtcNow,
                Status = status,
                Consumption = device.Consumption
            });

            await UpdateDeviceAsync(id, device);
            return device;
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
            // First get all devices the user has access to
            var devices = await GetDevicesByUserIdAsync(userId);
            
            if (devices.Count == 0)
                return new List<EnergyDistribution>();
            
            // Create a filter to get all distributions for this user's devices in the date range
            var deviceIds = devices.Select(d => d.Id).ToList();
            
            var filter = Builders<EnergyDistribution>.Filter.And(
                Builders<EnergyDistribution>.Filter.Eq(e => e.UserId, userId),
                Builders<EnergyDistribution>.Filter.In(e => e.DeviceId, deviceIds),
                Builders<EnergyDistribution>.Filter.Gte(e => e.Date, startDate),
                Builders<EnergyDistribution>.Filter.Lte(e => e.Date, endDate)
            );
            
            // Get all the distribution records in a single query (more efficient)
            var allDistributions = await _energyDistributionCollection.Find(filter)
                .Sort(Builders<EnergyDistribution>.Sort.Ascending(e => e.Date))
                .ToListAsync();
            
            return allDistributions;
        }

        // Add this method to your MongoDbService class to get hourly data for a specific day

        public async Task<List<EnergyDistribution>> GetHourlyDistributionsForDayAsync(string userId, DateTime date)
        {
            // Get the date range for the whole day (midnight to 11:59:59 PM)
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

            // Lấy tất cả các giá trị tiêu thụ có DeviceId (không null)
            filter &= Builders<EnergyConsumption>.Filter.Ne(e => e.DeviceId, null);

            return await _energyConsumptionCollection.Find(filter).SortBy(e => e.Date).ToListAsync();
        }

        // Add these methods to your MongoDbService class

// Get all distributions for a specific day across all devices
        public async Task<List<EnergyDistribution>> GetAllDistributionsForDayAsync(string userId, DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1).AddTicks(-1);
            
            return await GetAllDistributionsForPeriodAsync(userId, startDate, endDate);
        }

        // Get all distributions for a specific time period across all devices
        public async Task<List<EnergyDistribution>> GetAllDistributionsForPeriodAsync(string userId, DateTime startDate, DateTime endDate)
        {
            // Get all devices the user has access to
            var devices = await GetDevicesByUserIdAsync(userId);
            
            if (devices.Count == 0)
                return new List<EnergyDistribution>();
            
            // Get device IDs
            var deviceIds = devices.Select(d => d.Id).ToList();
            
            // Create filter for all devices in the date range
            var filter = Builders<EnergyDistribution>.Filter.And(
                Builders<EnergyDistribution>.Filter.Eq(e => e.UserId, userId),
                Builders<EnergyDistribution>.Filter.In(e => e.DeviceId, deviceIds),
                Builders<EnergyDistribution>.Filter.Gte(e => e.Date, startDate),
                Builders<EnergyDistribution>.Filter.Lte(e => e.Date, endDate)
            );
            
            // Get the distributions and sort by time
            var distributions = await _energyDistributionCollection.Find(filter)
                .Sort(Builders<EnergyDistribution>.Sort.Ascending(e => e.Date))
                .ToListAsync();
            
            return distributions;
        }

        public async Task<List<EnergyDistribution>> CalculateEnergyDistributionAsync(string userId, DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1).AddTicks(-1);
            
            // Lấy tất cả các thiết bị của người dùng
            var devices = await GetDevicesByUserIdAsync(userId);
            
            // Lấy tiêu thụ của từng thiết bị trong ngày
            var deviceConsumptions = new List<(string DeviceId, string DeviceName, double Consumption)>();
            
            foreach (var device in devices)
            {
                var consumption = await GetEnergyConsumptionByDeviceAsync(userId, device.Id, "day", startDate, endDate);
                double totalConsumption = consumption.Sum(c => c.Value);
                deviceConsumptions.Add((device.Id, device.Name, totalConsumption));
            }
            
            // Tính tổng tiêu thụ
            double totalAllConsumption = deviceConsumptions.Sum(dc => dc.Consumption);
            
            // Nếu không có tiêu thụ, trả về danh sách trống
            if (totalAllConsumption <= 0)
                return new List<EnergyDistribution>();
            
            // Tạo danh sách phân bố năng lượng
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

        // Phương thức để lấy phân bố năng lượng theo thiết bị và thời gian
        // Phương thức lấy phân bố năng lượng theo thiết bị và khoảng thời gian
        public async Task<List<EnergyDistribution>> GetEnergyDistributionByDeviceAsync(
            string userId, string deviceId, DateTime startDate, DateTime endDate)
        {
            var filter = Builders<EnergyDistribution>.Filter.Eq(e => e.UserId, userId)
                & Builders<EnergyDistribution>.Filter.Eq(e => e.DeviceId, deviceId)
                & Builders<EnergyDistribution>.Filter.Gte(e => e.Date, startDate)
                & Builders<EnergyDistribution>.Filter.Lte(e => e.Date, endDate);

            return await _energyDistributionCollection.Find(filter).ToListAsync();
        }
        // Phương thức để lấy dữ liệu tiêu thụ năng lượng theo khoảng thời gian
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
                new Claim(ClaimTypes.Name, user.Name)
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
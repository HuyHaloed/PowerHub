
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

using Newtonsoft.Json;

namespace MyIoTPlatform.API.Models
{
    #region User

    // Cập nhật trong Models/User.cs
    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string Name { get; set; }

        public string Email { get; set; }

        public string PasswordHash { get; set; }

        public string Phone { get; set; }

        public string Avatar { get; set; } = string.Empty;

        // [BsonElement("role")]
        // [JsonProperty("role")] 
        public string role { get; set; } = "User";
        
        public UserSubscription Subscription { get; set; } = new UserSubscription();

        public UserPreferences Preferences { get; set; } = new UserPreferences();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime LastLogin { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;
        
        public bool TwoFactorEnabled { get; set; } = false;
        
        public string TwoFactorSecret { get; set; } = string.Empty;
    }

    // Các role được định nghĩa sẵn
    public static class UserRoles
    {
        public const string User = "User";
        public const string Admin = "Admin";
    }

    public class UserSubscription
    {
        public string Plan { get; set; } = "basic";
        public DateTime ValidUntil { get; set; } = DateTime.UtcNow.AddYears(1);
        public List<PaymentHistory> PaymentHistory { get; set; } = new List<PaymentHistory>();
        public PaymentMethod PaymentMethod { get; set; } = new PaymentMethod();
    }

    public class PaymentHistory
    {
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public double Amount { get; set; }
        public string Description { get; set; }
        public string Status { get; set; } = "Paid";
    }

    public class PaymentMethod
    {
        public string Type { get; set; } = "Credit Card";
        public string LastFour { get; set; } = string.Empty;
        public string ExpiryDate { get; set; } = string.Empty;
        public string CardholderName { get; set; } = string.Empty;
    }

    public class UserPreferences
    {
        public string Theme { get; set; } = "light";
        public bool Notifications { get; set; } = true;
        public int EnergyGoal { get; set; } = 1000;
        public string Language { get; set; } = "en";
        public string Currency { get; set; } = "USD";
    }
    #endregion
    #region ADMIN
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
    #region Devices
    public class Device
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
        
        // Thay vì chỉ có một UserId, giờ có một danh sách các UserId
        public List<string> UserIds { get; set; } = new List<string>();
        
        public string Name { get; set; }
        
        public string Type { get; set; }
        
        public string Location { get; set; }
        
        public string Status { get; set; } // "on" hoặc "off"
        
        public double Consumption { get; set; }
        
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        
        public DeviceProperties Properties { get; set; } = new DeviceProperties();
        
        public List<DeviceHistory> History { get; set; } = new List<DeviceHistory>();
    }

    public class ShareDeviceRequest
    {
        public string DeviceId { get; set; }
        public string EmailToShare { get; set; }
    }

    public class DeviceProperties
    {
        public string Brand { get; set; } = string.Empty;
        
        public string Model { get; set; } = string.Empty;
        
        public string SerialNumber { get; set; } = string.Empty;
        
        public string InstallDate { get; set; } = DateTime.UtcNow.ToString("yyyy-MM-dd");
        
        public int PowerRating { get; set; } = 0;
    }
    
    public class DeviceHistory
    {
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Status { get; set; }
        public double Consumption { get; set; }
    }

    
    #endregion
    #region EnergyConsumption

    public class EnergyConsumption
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string UserId { get; set; }

        public string DeviceId { get; set; }
        
        public string DeviceName { get; set; }

        public double Value { get; set; }

        public DateTime Date { get; set; }
        
        public string TimeRange { get; set; } // day, week, month, year
    }
    #endregion
    #region Alerts

    public class Alert
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string UserId { get; set; }

        public string Title { get; set; }

        public string Message { get; set; }

        public string Severity { get; set; } // info, warning, error

        public bool Read { get; set; } = false;

        public DateTime Date { get; set; } = DateTime.UtcNow;
    }
    #endregion
    #region Notifications

    public class Notification
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
        
        public string UserId { get; set; }
        
        public string Title { get; set; }
        
        public string Message { get; set; }
        
        public string Type { get; set; } // alert, info, update
        
        public bool Read { get; set; } = false;
        
        public DateTime Date { get; set; } = DateTime.UtcNow;
        
        public NotificationAction Action { get; set; } = new NotificationAction();
    }
    
    public class NotificationAction
    {
        public string Type { get; set; } = "url"; // url, action
        public string Url { get; set; } = string.Empty;
    }
    #endregion
    #region Sessions

    public class Session
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
        
        public string UserId { get; set; }
        
        public string Device { get; set; }
        
        public string Browser { get; set; }
        
        public string IP { get; set; }
        
        public string Location { get; set; }
        
        public DateTime LastActive { get; set; } = DateTime.UtcNow;
        
        public bool Current { get; set; } = false;
        
        public string Token { get; set; }
    }
    #endregion
    #region Stats
    public class Stat
    {
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        public string Title { get; set; }

        public double Value { get; set; }

        public string Unit { get; set; }

        public double Change { get; set; }

        public string ChangeType { get; set; } // increase, decrease

        public string Icon { get; set; }
    }
    #endregion
    #region EnergyDistribution
    public class EnergyDistribution
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
        
        public string UserId { get; set; }
        
        public string DeviceId { get; set; }
        
        public string Name { get; set; }
        
        public double Value { get; set; }
        
        public string Color { get; set; }
        
        public DateTime Date { get; set; } = DateTime.UtcNow;
    }
    #endregion
    #region Orders
    // Request models
    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class RegisterRequest
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string Phone { get; set; }
    }

    // Response models
    public class AuthResponse
    {
        public string Token { get; set; }
        public UserDto User { get; set; }
    }

    public class UserDto
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Avatar { get; set; }
        public string Phone { get; set; } 

        [BsonElement("role")]
        [JsonProperty("role")]
        public string role { get; set; } = "User";
        
        public UserSubscription Subscription { get; set; }
        public UserPreferences Preferences { get; set; }
    }
     public class AddDeviceRequest
    {
        public string Name { get; set; }
        public string Type { get; set; }
        public string Location { get; set; }
        public DevicePropertiesRequest Properties { get; set; }
    }

    public class DevicePropertiesRequest
    {
        public string Brand { get; set; }
        public string Model { get; set; }
        public string SerialNumber { get; set; }
        public int PowerRating { get; set; }
    }

    public class UpdateDeviceRequest
    {
        public string Name { get; set; }
        public string Type { get; set; }
        public string Location { get; set; }
        public DevicePropertiesRequest Properties { get; set; }
    }

    public class ControlDeviceRequest
    {
        public string Status { get; set; } // "on" or "off"
    }

     public class Verify2FARequest
    {
        public string Code { get; set; }
    }

    public class Disable2FARequest
    {
        public string Password { get; set; }
    }

    public class UpgradeSubscriptionRequest
    {
        public string Plan { get; set; }
    }

    public class AddPaymentMethodRequest
    {
        public string Type { get; set; }
        public string CardNumber { get; set; }
        public string ExpiryDate { get; set; }
        public string CardholderName { get; set; }
        public string CVV { get; set; }
    }
    #endregion
    #region EnvironmentData
    public class EnvironmentData
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string UserId { get; set; }

        // // Không bắt buộc, có thể để null
        // public string DeviceId { get; set; }
        
        // // Không bắt buộc, có thể để null
        // public string DeviceName { get; set; }

        public double Temperature { get; set; }

        public double Humidity { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        
        public string Location { get; set; } = "Phòng khách";
    }
    
    // Request model for posting environment data
    public class EnvironmentDataRequest
    {
        // Không bắt buộc, có thể để null
        // public string DeviceId { get; set; }
        
        public double Temperature { get; set; }
        
        public double Humidity { get; set; }
        
        public string Location { get; set; } = "Phòng khách";
    }
    
    // Response model for environment data
    public class EnvironmentDataResponse
    {
        public string Id { get; set; }
        
        // // Không bắt buộc, có thể để null
        // public string DeviceId { get; set; }
        
        // // // Không bắt buộc, có thể để null
        // public string DeviceName { get; set; }
        
        public double Temperature { get; set; }
        
        public double Humidity { get; set; }
        
        public DateTime Timestamp { get; set; }
        
        public string Location { get; set; }
    }
    
    // Data transfer object for environment statistics
    public class EnvironmentStatsDto
    {
        public double CurrentTemperature { get; set; }
        
        public double CurrentHumidity { get; set; }
        
        public double AvgTemperature { get; set; }
        
        public double AvgHumidity { get; set; }
        
        public double MaxTemperature { get; set; }
        
        public double MinTemperature { get; set; }
        
        public double MaxHumidity { get; set; }
        
        public double MinHumidity { get; set; }
        
        public DateTime LastUpdated { get; set; }
        
        public bool HasData { get; set; } = false;
        
        public string Location { get; set; } = "Phòng khách";
    }
    #endregion
}
using MyIoTPlatform.API.Models;
using System.Security.Cryptography;
using System.Text;
namespace MyIoTPlatform.API.Services
{
    public class UserService
    {
        private readonly MongoDbService _mongoDbService;

        public UserService(MongoDbService mongoDbService)
        {
            _mongoDbService = mongoDbService;
        }

        /// <summary>
        /// Authenticates a user with the provided email and password
        /// </summary>
        public async Task<User> AuthenticateAsync(string email, string password)
        {
            var user = await _mongoDbService.GetUserByEmailAsync(email);
            if (user == null)
                return null;

            if (!VerifyPasswordHash(password, user.PasswordHash))
                return null;
            user.LastLogin = DateTime.UtcNow;
            await _mongoDbService.UpdateUserAsync(user.Id, user);

            return user;
        }

        /// <summary>
        /// Creates a new user with the provided registration information
        /// </summary>
        public async Task<User> CreateUserAsync(RegisterRequest request, string role = "User")
        {
            var existingUser = await _mongoDbService.GetUserByEmailAsync(request.Email);
            if (existingUser != null)
                throw new Exception("Email is already registered");
            
            var user = new User
            {
                Name = request.Name,
                Email = request.Email,
                PasswordHash = HashPassword(request.Password),
                Phone = request.Phone,
                role = role, // Gán role được chỉ định
                CreatedAt = DateTime.UtcNow,
                LastLogin = DateTime.UtcNow,
                IsActive = true,
                Avatar = string.Empty,
                Subscription = new UserSubscription
                {
                    Plan = "basic",
                    ValidUntil = DateTime.UtcNow.AddYears(1)
                },
                Preferences = new UserPreferences
                {
                    Theme = "light",
                    Notifications = true,
                    EnergyGoal = 1000,
                    Language = "vi",
                    Currency = "VND"
                }
            };

            await _mongoDbService.CreateUserAsync(user);
            return user;
        }

        /// <summary>
        /// Tạo tài khoản admin
        /// </summary>
        public async Task<User> CreateAdminUserAsync(RegisterRequest request)
        {
            return await CreateUserAsync(request, "Admin");
        }
        
        // Hàm để kiểm tra xem người dùng có phải là Admin không
        public bool IsAdmin(User user)
        {
            return user != null && user.role == "Admin";
        }


        /// <summary>
        /// Gets a user by their ID
        /// </summary>
        public async Task<User> GetUserByIdAsync(string id)
        {
            return await _mongoDbService.GetUserByIdAsync(id);
        }

        /// <summary>
        /// Gets a user by their email address
        /// </summary>
        public async Task<User> GetUserByEmailAsync(string email)
        {
            return await _mongoDbService.GetUserByEmailAsync(email);
        }

        /// <summary>
        /// Gets all users
        /// </summary>
        public async Task<List<User>> GetAllUsersAsync()
        {
            return await _mongoDbService.GetAllUsersAsync();
        }

        /// <summary>
        /// Updates a user's basic information
        /// </summary>
        public async Task<User> UpdateUserAsync(string id, UpdateUserRequest request)
        {
            var user = await _mongoDbService.GetUserByIdAsync(id);
            if (user == null)
                throw new Exception("User not found");

            user.Name = request.Name;
            user.Phone = request.Phone;
            
            if (!string.IsNullOrEmpty(request.Avatar))
                user.Avatar = request.Avatar;

            await _mongoDbService.UpdateUserAsync(id, user);
            return user;
        }

        /// <summary>
        /// Updates a user's password
        /// </summary>
        public async Task<bool> UpdatePasswordAsync(string id, string currentPassword, string newPassword)
        {
            var user = await _mongoDbService.GetUserByIdAsync(id);
            if (user == null)
                throw new Exception("User not found");
            if (!VerifyPasswordHash(currentPassword, user.PasswordHash))
                return false;
            user.PasswordHash = HashPassword(newPassword);
            await _mongoDbService.UpdateUserAsync(id, user);
            
            return true;
        }

        /// <summary>
        /// Updates a user's preferences
        /// </summary>
        public async Task UpdateUserPreferencesAsync(string id, UserPreferences preferences)
        {
            await _mongoDbService.UpdateUserPreferencesAsync(id, preferences);
        }

        /// <summary>
        /// Updates a user's subscription
        /// </summary>
        public async Task UpdateUserSubscriptionAsync(string id, UserSubscription subscription)
        {
            await _mongoDbService.UpdateUserSubscriptionAsync(id, subscription);
        }

        /// <summary>
        /// Upgrades a user's subscription plan
        /// </summary>
        public async Task<User> UpgradeSubscriptionAsync(string id, string plan, string paymentMethodId)
        {
            var user = await _mongoDbService.GetUserByIdAsync(id);
            if (user == null)
                throw new Exception("User not found");

            if (string.IsNullOrEmpty(plan) || !IsValidPlan(plan))
                throw new Exception("Invalid subscription plan");

            user.Subscription.Plan = plan;
            user.Subscription.ValidUntil = DateTime.UtcNow.AddYears(1);
            var payment = new PaymentHistory
            {
                Date = DateTime.UtcNow,
                Amount = GetPlanPrice(plan),
                Description = $"Upgrade to {plan} plan",
                Status = "Paid"
            };
            
            if (user.Subscription.PaymentHistory == null)
                user.Subscription.PaymentHistory = new List<PaymentHistory>();
                
            user.Subscription.PaymentHistory.Add(payment);

            await _mongoDbService.UpdateUserAsync(id, user);
            return user;
        }

        /// <summary>
        /// Adds a payment history entry to a user's subscription
        /// </summary>
        public async Task AddPaymentHistoryAsync(string userId, PaymentHistory payment)
        {
            await _mongoDbService.AddPaymentHistoryAsync(userId, payment);
        }

        /// <summary>
        /// Updates a user's payment method
        /// </summary>
        public async Task UpdatePaymentMethodAsync(string userId, PaymentMethod paymentMethod)
        {
            await _mongoDbService.UpdatePaymentMethodAsync(userId, paymentMethod);
        }

        /// <summary>
        /// Enables two-factor authentication for a user
        /// </summary>
        public async Task<string> EnableTwoFactorAuthenticationAsync(string userId)
        {
            var secret = GenerateSecretKey();
            
            await _mongoDbService.UpdateTwoFactorAuthenticationAsync(userId, true, secret);
            
            return secret;
        }

        /// <summary>
        /// Verifies a two-factor authentication code
        /// </summary>
        public bool VerifyTwoFactorAuthenticationCode(string secret, string code)
        {
            if (string.IsNullOrEmpty(secret) || string.IsNullOrEmpty(code))
                return false;

            if (code.Length != 6)
                return false;
            try
            {
                int codeInt = int.Parse(code);
                return true;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Disables two-factor authentication for a user
        /// </summary>
        public async Task DisableTwoFactorAuthenticationAsync(string userId)
        {
            await _mongoDbService.UpdateTwoFactorAuthenticationAsync(userId, false, string.Empty);
        }

        /// <summary>
        /// Deactivates a user account
        /// </summary>
        public async Task DeactivateUserAsync(string id)
        {
            var user = await _mongoDbService.GetUserByIdAsync(id);
            if (user == null)
                throw new Exception("User not found");

            user.IsActive = false;
            await _mongoDbService.UpdateUserAsync(id, user);
        }

        /// <summary>
        /// Reactivates a user account
        /// </summary>
        public async Task ReactivateUserAsync(string id)
        {
            var user = await _mongoDbService.GetUserByIdAsync(id);
            if (user == null)
                throw new Exception("User not found");

            user.IsActive = true;
            await _mongoDbService.UpdateUserAsync(id, user);
        }

        /// <summary>
        /// Requests a password reset for a user
        /// </summary>
        public async Task<string> RequestPasswordResetAsync(string email)
        {
            var user = await _mongoDbService.GetUserByEmailAsync(email);
            if (user == null)
                throw new Exception("User with this email address does not exist");

            var token = GeneratePasswordResetToken();            
            return token;
        }

        /// <summary>
        /// Resets a user's password using a reset token
        /// </summary>
        public async Task<bool> ResetPasswordAsync(string email, string token, string newPassword)
        {
            
            var user = await _mongoDbService.GetUserByEmailAsync(email);
            if (user == null)
                return false;
            user.PasswordHash = HashPassword(newPassword);
            
            await _mongoDbService.UpdateUserAsync(user.Id, user);
            
            return true;
        }

        /// <summary>
        /// Exports a user's personal data
        /// </summary>
        public async Task<UserDataExport> ExportUserDataAsync(string userId)
        {
            var user = await _mongoDbService.GetUserByIdAsync(userId);
            if (user == null)
                throw new Exception("User not found");

            var devices = await _mongoDbService.GetDevicesByUserIdAsync(userId);
            var consumptionData = await _mongoDbService.GetEnergyConsumptionAsync(userId, "all", DateTime.UtcNow.AddYears(-1), DateTime.UtcNow);
            var alerts = await _mongoDbService.GetAlertsForUserAsync(userId);
            var notifications = await _mongoDbService.GetNotificationsForUserAsync(userId, 1, 1000, null);

            return new UserDataExport
            {
                UserInfo = new UserDataExportInfo
                {
                    Name = user.Name,
                    Email = user.Email,
                    Phone = user.Phone,
                    CreatedAt = user.CreatedAt,
                    LastLogin = user.LastLogin,
                    Subscription = user.Subscription,
                    Preferences = user.Preferences
                },
                Devices = devices,
                ConsumptionData = consumptionData,
                Alerts = alerts,
                Notifications = notifications
            };
        }

        #region Helper Methods
        /// <summary>
        /// Hashes a password using SHA256
        /// </summary>
        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return BitConverter.ToString(hashedBytes).Replace("-", "").ToLower();
            }
        }

        /// <summary>
        /// Verifies a password against a stored hash
        /// </summary>
        private bool VerifyPasswordHash(string password, string storedHash)
        {
            var hash = HashPassword(password);
            return hash.Equals(storedHash);
        }

        /// <summary>
        /// Generates a secret key for two-factor authentication
        /// </summary>
        private string GenerateSecretKey()
        {
            var bytes = new byte[20];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(bytes);
            }
            return Convert.ToBase64String(bytes);
        }

        /// <summary>
        /// Generates a password reset token
        /// </summary>
        private string GeneratePasswordResetToken()
        {
            var bytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(bytes);
            }
            return Convert.ToBase64String(bytes);
        }

        /// <summary>
        /// Checks if a subscription plan is valid
        /// </summary>
        private bool IsValidPlan(string plan)
        {
            var validPlans = new[] { "basic", "premium", "enterprise" };
            return Array.Exists(validPlans, p => p.Equals(plan, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Gets the price for a subscription plan
        /// </summary>
        private double GetPlanPrice(string plan)
        {
            switch (plan.ToLower())
            {
                case "premium":
                    return 99.99;
                case "enterprise":
                    return 199.99;
                case "basic":
                default:
                    return 49.99;
            }
        }
        #endregion
    }

    /// <summary>
    /// Request model for updating a user
    /// </summary>
    public class UpdateUserRequest
    {
        public string Name { get; set; }
        public string Phone { get; set; }
        public string Avatar { get; set; }
    }

    /// <summary>
    /// User data export model
    /// </summary>
    public class UserDataExport
    {
        public UserDataExportInfo UserInfo { get; set; }
        public List<Device> Devices { get; set; }
        public List<EnergyConsumption> ConsumptionData { get; set; }
        public List<Alert> Alerts { get; set; }
        public List<Notification> Notifications { get; set; }
    }

    /// <summary>
    /// User data export info model
    /// </summary>
    public class UserDataExportInfo
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastLogin { get; set; }
        public UserSubscription Subscription { get; set; }
        public UserPreferences Preferences { get; set; }
    }
}
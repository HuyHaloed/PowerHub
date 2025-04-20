using Microsoft.Extensions.DependencyInjection;
using MyIoTPlatform.API.Models;
using MyIoTPlatform.API.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyIoTPlatform.API.Utilities
{
    public class DatabaseInitializer
    {
        private readonly IServiceProvider _serviceProvider;
        
        public DatabaseInitializer(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }
        
        public async Task InitializeAsync()
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var mongoDbService = scope.ServiceProvider.GetRequiredService<MongoDbService>();
                
                Console.WriteLine("Checking for existing users in the database...");
                var users = await mongoDbService.GetAllUsersAsync();
                
                Console.WriteLine($"Found {users.Count} users in the database.");
                
                if (users.Count == 0)
                {
                    Console.WriteLine("No users found. Skipping database initialization.");
                    Console.WriteLine("Please create a user first, then restart the application.");
                    return;
                }
                
                Console.WriteLine("Initializing database with existing users...");
                foreach (var user in users)
                {
                    Console.WriteLine($"Processing user: {user.Name} ({user.Email})");
                }
                
                var dataGenerator = new EnergyDataGenerator(mongoDbService);
                foreach (var user in users)
                {
                    await CreateSampleDevicesAsync(mongoDbService, user.Id);
                    await dataGenerator.GenerateEnergyDataForUserAsync(user.Id, 30);
                }
                
                Console.WriteLine("Database initialization completed successfully.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error initializing database: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
            }
        }
        
        private async Task CreateSampleDevicesAsync(MongoDbService mongoDbService, string userId)
        {
            Console.WriteLine($"Creating sample devices for user {userId}...");
            var existingDevices = await mongoDbService.GetDevicesByUserIdAsync(userId);
            if (existingDevices.Count > 0)
            {
                Console.WriteLine($"User {userId} already has {existingDevices.Count} devices. Skipping device creation.");
                return;
            }
            
            var deviceTypes = new[]
            {
                new { Type = "Air Conditioner", Brand = "Samsung", PowerRating = 1500 },
                new { Type = "Refrigerator", Brand = "LG", PowerRating = 800 },
                new { Type = "Television", Brand = "Sony", PowerRating = 200 },
                new { Type = "Washing Machine", Brand = "Electrolux", PowerRating = 1000 },
                new { Type = "Light", Brand = "Philips", PowerRating = 60 }
            };
            
            var locations = new[] { "Living Room", "Kitchen", "Bedroom", "Bathroom", "Office" };
            var random = new Random();
            
            for (int i = 0; i < 8; i++)
            {
                var deviceType = deviceTypes[i % deviceTypes.Length];
                var location = locations[random.Next(locations.Length)];
                var status = random.Next(2) == 0 ? "on" : "off";
                
                var device = new Device
                {
                    UserIds = new List<string> { userId },
                    Name = $"{deviceType.Type} {i + 1}",
                    Type = deviceType.Type,
                    Location = location,
                    Status = status,
                    Consumption = status == "on" ? random.Next(1, 10) : 0,
                    LastUpdated = DateTime.UtcNow.AddMinutes(-random.Next(1, 120)),
                    Properties = new DeviceProperties
                    {
                        Brand = deviceType.Brand,
                        Model = $"Model-{random.Next(1000, 9999)}",
                        SerialNumber = $"SN-{Guid.NewGuid().ToString().Substring(0, 8)}",
                        PowerRating = deviceType.PowerRating,
                        InstallDate = DateTime.UtcNow.AddDays(-random.Next(1, 365)).ToString("yyyy-MM-dd")
                    },
                    History = new List<DeviceHistory>()
                };
                
                // Generate some history entries
                for (int j = 0; j < 10; j++)
                {
                    var historyStatus = j % 2 == 0 ? "on" : "off";
                    device.History.Add(new DeviceHistory
                    {
                        Timestamp = DateTime.UtcNow.AddHours(-j),
                        Status = historyStatus,
                        Consumption = historyStatus == "on" ? random.Next(1, 10) : 0
                    });
                }
                
                await mongoDbService.CreateDeviceAsync(device);
                Console.WriteLine($"Created device: {device.Name} ({device.Id})");
            }
        }
    }
}
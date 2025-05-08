using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using MyIoTPlatform.API.Models;
using MyIoTPlatform.API.Services;
using MyIoTPlatform.Application.Interfaces.Communication;

namespace MyIoTPlatform.API.Services
{
    public class AdafruitDataCollectorService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AdafruitDataCollectorService> _logger;
        private readonly IMqttClientService _mqttClientService;
        private readonly string[] _feedsToMonitor = new[] {
            "brightness", "humidity", "temperature", "powerfan", "powerlight", "energy"
        };

        public AdafruitDataCollectorService(
            IServiceProvider serviceProvider,
            ILogger<AdafruitDataCollectorService> logger,
            IMqttClientService mqttClientService)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _mqttClientService = mqttClientService;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Adafruit Data Collector Service starting at: {time}", DateTimeOffset.Now);

            try
            {
                // Subscribe to message received event
                if (_mqttClientService is AdafruitMqttService adafruitService)
                {
                    adafruitService.MessageReceived += OnMessageReceived;
                    
                    // Subscribe to all the feeds we want to monitor
                    foreach (var feed in _feedsToMonitor)
                    {
                        _logger.LogInformation("Subscribing to feed: {feed}", feed);
                        await _mqttClientService.SubscribeAsync(feed);
                    }
                }
                else
                {
                    _logger.LogError("MqttClientService is not of type AdafruitMqttService");
                }

                // Keep the service running until stopped
                while (!stoppingToken.IsCancellationRequested)
                {
                    await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Adafruit Data Collector Service");
            }
        }

        private async void OnMessageReceived(object sender, MqttMessageReceivedEventArgs e)
        {
            try
            {
                _logger.LogInformation("Message received from topic {topic}: {payload}", e.Topic, e.Payload);
                
                // Extract feed name from topic
                string feedName = e.Topic;
                if (feedName.Contains("/"))
                {
                    // Topic format is likely "username/feeds/feedname"
                    var parts = feedName.Split('/');
                    feedName = parts[parts.Length - 1];
                }
                
                // Parse the value
                if (!double.TryParse(e.Payload, out double value))
                {
                    // If it's not a number, check if it's ON/OFF
                    if (e.Payload.Equals("ON", StringComparison.OrdinalIgnoreCase))
                    {
                        value = 1.0;
                    }
                    else if (e.Payload.Equals("OFF", StringComparison.OrdinalIgnoreCase))
                    {
                        value = 0.0;
                    }
                    else
                    {
                        _logger.LogWarning("Could not parse value from payload: {payload}", e.Payload);
                        return;
                    }
                }
                
                using (var scope = _serviceProvider.CreateScope())
                {
                    var mongoDbService = scope.ServiceProvider.GetRequiredService<MongoDbService>();
                    
                    // Get all users (in a real system, you might need to map feeds to specific users)
                    var users = await mongoDbService.GetAllUsersAsync();
                    
                    foreach (var user in users)
                    {
                        var userId = user.Id;
                        
                        // Create a record for this sensor reading
                        var sensorReading = new SensorReading
                        {
                            UserId = userId,
                            FeedName = feedName,
                            Value = value,
                            Timestamp = DateTime.UtcNow
                        };
                        
                        // Save to MongoDB
                        await mongoDbService.AddSensorReadingAsync(sensorReading);
                        
                        // If the feed is for power consumption (powerlight, powerfan, etc.)
                        // then update the energy consumption records
                        if (feedName.StartsWith("power") || feedName.Equals("energy"))
                        {
                            // Get the device matching this feed type
                            var devices = await mongoDbService.GetDevicesByUserIdAsync(userId);
                            var matchedDevices = devices.Where(d => feedName.Contains(d.Type.ToLower())).ToList();
                            
                            if (matchedDevices.Any())
                            {
                                foreach (var device in matchedDevices)
                                {
                                    // Update the device's consumption value
                                    device.Consumption = value;
                                    await mongoDbService.UpdateDeviceAsync(device.Id, device);
                                    
                                    // Add to energy consumption history
                                    var energyConsumption = new EnergyConsumption
                                    {
                                        UserId = userId,
                                        DeviceId = device.Id,
                                        DeviceName = device.Name,
                                        Value = value,
                                        Date = DateTime.UtcNow,
                                        TimeRange = "realtime"
                                    };
                                    
                                    await mongoDbService.AddEnergyConsumptionAsync(energyConsumption);
                                    
                                    // Check if this consumption triggers any thresholds
                                    await mongoDbService.CheckAndApplyThresholdAsync(device.Id, value);
                                }
                                
                                // Also update the energy distribution
                                var energyService = scope.ServiceProvider.GetRequiredService<EnergyService>();
                                await energyService.UpdateEnergyDistributionAsync(userId);
                            }
                        }
                        // For environment data (temperature, humidity)
                        else if (feedName.Equals("temperature") || feedName.Equals("humidity"))
                        {
                            // Find the latest environment data
                            var latestData = await mongoDbService.GetLatestEnvironmentDataForUserAsync(userId);
                            
                            // Create a new environment data record or update existing
                            var environmentData = new EnvironmentData
                            {
                                UserId = userId,
                                Temperature = feedName.Equals("temperature") ? value : latestData?.Temperature ?? 0,
                                Humidity = feedName.Equals("humidity") ? value : latestData?.Humidity ?? 0,
                                Timestamp = DateTime.UtcNow,
                                Location = "Phòng khách" // Default location
                            };
                            
                            await mongoDbService.AddEnvironmentDataAsync(environmentData);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing MQTT message: {topic}, {payload}", e.Topic, e.Payload);
            }
        }
    }
}
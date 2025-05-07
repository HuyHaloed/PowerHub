using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using MyIoTPlatform.API.Services;
using MyIoTPlatform.Application.Interfaces.Communication;

namespace MyIoTPlatform.API.Controllers
{
    public class ScheduleBackgroundService : BackgroundService
    {
        private readonly ConcurrentDictionary<string, DeviceScheduleEntry> _schedules;
        private readonly ILogger<ScheduleBackgroundService> _logger;
        // Track the last known state of each device
        private readonly ConcurrentDictionary<string, string> _deviceStates = new();
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _baseUrl;
        private readonly MongoDbService _mongoDbService;
        private readonly IHubContext<DeviceHub> _hubContext;
        private readonly IMqttClientService _adafruitMqttService;

        public ScheduleBackgroundService(
            ConcurrentDictionary<string, DeviceScheduleEntry> schedules,
            IHttpClientFactory httpClientFactory,
            ILogger<ScheduleBackgroundService> logger,
            IConfiguration configuration,
            MongoDbService mongoDbService,
            IHubContext<DeviceHub> hubContext,
            IMqttClientService adafruitMqttService)
        {
            _schedules = schedules;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
            _mongoDbService = mongoDbService;
            _hubContext = hubContext;
            _adafruitMqttService = adafruitMqttService;

            // Get the base URL from configuration (if provided) or use default
            _baseUrl = configuration["ApiBaseUrl"] ?? "https://localhost:5001";
            _logger.LogInformation($"Scheduler using base URL: {_baseUrl}");
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Schedule Background Service is starting.");

            // Initial load of device states
            await LoadCurrentDeviceStatesAsync(stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var now = DateTime.Now;
                    var currentTime = now.TimeOfDay;
                    var currentDayOfWeek = now.DayOfWeek;

                    foreach (var entry in _schedules.Values.ToList())
                    {
                        if (entry.DeviceId == null) continue;

                        // Check if schedule should run on current day (if DaysOfWeek is empty, run every day)
                        bool runOnThisDay = entry.DaysOfWeek.Count == 0 || entry.DaysOfWeek.Contains(currentDayOfWeek);
                        if (!runOnThisDay) continue;

                        // For debugging
                        _logger.LogDebug($"Checking schedule for device {entry.DeviceId} at {currentTime}, OnTime: {entry.OnTime}, OffTime: {entry.OffTime}");

                        // Get the device from MongoDB to ensure we have the current name
                        var device = await _mongoDbService.GetDeviceByIdAsync(entry.DeviceId);
                        if (device == null)
                        {
                            _logger.LogWarning($"Device with ID {entry.DeviceId} not found in database. Skipping schedule check.");
                            continue;
                        }

                        // Update device name in schedule if needed
                        if (entry.DeviceName != device.Name)
                        {
                            entry.DeviceName = device.Name;
                            _schedules.AddOrUpdate(entry.DeviceId, entry, (key, oldValue) => entry);
                        }

                        // Check if current time is within 1 minute after OnTime
                        if (IsWithinOneMinute(currentTime, entry.OnTime))
                        {
                            // Only turn on if currently off or state unknown
                            if (!_deviceStates.TryGetValue(entry.DeviceId, out var currentState) || currentState != "ON")
                            {
                                _logger.LogInformation($"[Background Service] Time to turn ON device {device.Name}");
                                if (await PublishViaApiEndpointAsync(device.Name, "ON", stoppingToken))
                                {
                                    // Update local state
                                    _deviceStates.AddOrUpdate(entry.DeviceId, "ON", (key, oldValue) => "ON");
                                    
                                    // Also update device status in MongoDB
                                    await UpdateDeviceStatusInDatabaseAsync(entry.DeviceId, "ON");
                                    
                                    // Notify clients via SignalR
                                    await NotifyDeviceStateChangeAsync(device.Id, device.Name, "ON");
                                    
                                    // Directly publish to Adafruit MQTT
                                    await PublishToAdafruitMqttAsync(device.Name, "ON");
                                }
                            }
                            else
                            {
                                _logger.LogInformation($"[Background Service] Device {device.Name} is already ON, skipping scheduled action");
                            }
                        }

                        // Check if current time is within 1 minute after OffTime
                        if (IsWithinOneMinute(currentTime, entry.OffTime))
                        {
                            // Only turn off if currently on or state unknown
                            if (!_deviceStates.TryGetValue(entry.DeviceId, out var currentState) || currentState != "OFF")
                            {
                                _logger.LogInformation($"[Background Service] Time to turn OFF device {device.Name}");
                                if (await PublishViaApiEndpointAsync(device.Name, "OFF", stoppingToken))
                                {
                                    // Update local state
                                    _deviceStates.AddOrUpdate(entry.DeviceId, "OFF", (key, oldValue) => "OFF");
                                    
                                    // Also update device status in MongoDB
                                    await UpdateDeviceStatusInDatabaseAsync(entry.DeviceId, "OFF");
                                    
                                    // Notify clients via SignalR
                                    await NotifyDeviceStateChangeAsync(device.Id, device.Name, "OFF");
                                    
                                    // Directly publish to Adafruit MQTT
                                    await PublishToAdafruitMqttAsync(device.Name, "OFF");
                                }
                            }
                            else
                            {
                                _logger.LogInformation($"[Background Service] Device {device.Name} is already OFF, skipping scheduled action");
                            }
                        }
                    }

                    // Refresh device states every 5 minutes to ensure local state matches reality
                    if (now.Minute % 5 == 0 && now.Second < 30)
                    {
                        await LoadCurrentDeviceStatesAsync(stoppingToken);
                    }

                    // Wait for 30 seconds before checking again
                    await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    // Service is shutting down - normal behavior
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in schedule background service execution.");
                    // Wait a bit before trying again
                    await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
                }
            }

            _logger.LogInformation("Schedule Background Service is stopping.");
        }

        private async Task LoadCurrentDeviceStatesAsync(CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Refreshing current device states from database");
                
                // Get all unique device IDs from the schedules
                var deviceIds = _schedules.Values
                    .Where(s => s.DeviceId != null)
                    .Select(s => s.DeviceId!)
                    .Distinct()
                    .ToList();

                foreach (var deviceId in deviceIds)
                {
                    try
                    {
                        var device = await _mongoDbService.GetDeviceByIdAsync(deviceId);
                        if (device != null)
                        {
                            _deviceStates.AddOrUpdate(deviceId, device.Status, (key, oldValue) => device.Status);
                            _logger.LogInformation($"Updated state for device {device.Name} to {device.Status}");
                        }
                        else
                        {
                            _logger.LogWarning($"Device with ID {deviceId} not found in database");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error getting state for device {deviceId}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading device states");
            }
        }

        private bool IsWithinOneMinute(TimeSpan current, TimeSpan target)
        {
            // Convert both times to total seconds for easier comparison
            double currentSeconds = current.TotalSeconds;
            double targetSeconds = target.TotalSeconds;
            
            // Check if current time is within 1 minute (60 seconds) after target time
            return currentSeconds >= targetSeconds && currentSeconds < targetSeconds + 60;
        }

        private async Task<bool> PublishViaApiEndpointAsync(string deviceName, string value, CancellationToken cancellationToken)
        {
            int retryCount = 0;
            const int maxRetries = 3;
            bool published = false;

            // Create a client specifically for calling the API
            using var httpClient = _httpClientFactory.CreateClient();
            
            while (!published && retryCount < maxRetries && !cancellationToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation($"[Background Service] Attempting to publish {value} to device '{deviceName}' (Attempt {retryCount + 1}/{maxRetries})");

                    // Create the request to publish to Adafruit MQTT
                    var request = new AdafruitPublishRequest
                    {
                        Feed = deviceName,  // Format feed name to match Adafruit's format
                        Payload = value,
                        Retain = true,
                        QosLevel = 1
                    };

                    // Send the request to the AdafruitMqttController - fix the URL to use the correct base
                    var response = await httpClient.PostAsync($"{_baseUrl}/api/adafruit/publish", 
                        new StringContent(
                            System.Text.Json.JsonSerializer.Serialize(request),
                            System.Text.Encoding.UTF8,
                            "application/json"), 
                        cancellationToken);
                    
                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation($"[Background Service] Successfully published value '{value}' to device '{deviceName}'");
                        published = true;
                    }
                    else
                    {
                        var error = await response.Content.ReadAsStringAsync(cancellationToken);
                        _logger.LogError($"[Background Service] Failed to publish to device '{deviceName}'. Status: {response.StatusCode}, Error: {error}");
                        retryCount++;
                        
                        if (retryCount < maxRetries)
                        {
                            // Exponential backoff
                            await Task.Delay(TimeSpan.FromSeconds(Math.Min(30, Math.Pow(2, retryCount))), cancellationToken);
                        }
                    }
                }
                catch (Exception ex)
                {
                    retryCount++;
                    _logger.LogError(ex, $"[Background Service] Error publishing to device '{deviceName}' (Attempt {retryCount}/{maxRetries})");
                    
                    if (retryCount < maxRetries)
                    {
                        await Task.Delay(TimeSpan.FromSeconds(Math.Min(30, Math.Pow(2, retryCount))), cancellationToken);
                    }
                }
            }

            return published;
        }
        
        private async Task UpdateDeviceStatusInDatabaseAsync(string deviceId, string status)
        {
            try
            {
                var device = await _mongoDbService.GetDeviceByIdAsync(deviceId);
                if (device != null)
                {
                    // Update device status
                    device.Status = status;
                    device.LastUpdated = DateTime.UtcNow;
                    
                    // // Add history entry if needed
                    // device.History.Add(new DeviceHistory
                    // {
                    //     Timestamp = DateTime.UtcNow,
                    //     Status = status,
                    //     Consumption = status == "ON" ? GetRandomConsumption() : 0
                    // });
                    
                    // Update in database
                    await _mongoDbService.UpdateDeviceAsync(deviceId, device);
                    _logger.LogInformation($"Updated device status in database: {device.Name} -> {status}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating device status in database for device {deviceId}");
            }
        }
        
        private double GetRandomConsumption()
        {
            Random random = new Random();
            return Math.Round(random.NextDouble() * 100, 2);
        }
        
        // New method to notify frontend clients of device state changes via SignalR
        private async Task NotifyDeviceStateChangeAsync(string deviceId, string deviceName, string status)
        {
            try
            {
                await _hubContext.Clients.All.SendAsync("DeviceStateChanged", new
                {
                    DeviceId = deviceId,
                    DeviceName = deviceName,
                    Status = status,
                    Timestamp = DateTime.UtcNow
                });
                
                _logger.LogInformation($"Notified clients of state change for device {deviceName} to {status}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error notifying clients of state change for device {deviceName}");
            }
        }
        
        // New method to directly publish to Adafruit MQTT without going through the API
        private async Task PublishToAdafruitMqttAsync(string deviceName, string value)
        {
            try
            {
                // Clean up device name to use as MQTT topic
                string feedName = deviceName.ToLower().Replace(" ", "_");
                
                await _adafruitMqttService.PublishAsync(feedName, value, true, 1);
                _logger.LogInformation($"[Background Service] Directly published value '{value}' to Adafruit MQTT feed '{feedName}'");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[Background Service] Error publishing directly to Adafruit MQTT for device '{deviceName}'");
            }
        }
    }
}
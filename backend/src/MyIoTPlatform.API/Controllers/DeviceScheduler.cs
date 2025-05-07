using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.Threading;
using System.Text.Json.Serialization;
using MyIoTPlatform.API.Services;


namespace MyIoTPlatform.API.Controllers
{
    public class DeviceScheduleEntry
    {
        public string? DeviceId { get; set; }
        public TimeSpan OnTime { get; set; }
        public TimeSpan OffTime { get; set; }
        // Add DaysOfWeek property to support scheduling on specific days
        public List<DayOfWeek> DaysOfWeek { get; set; } = new List<DayOfWeek>();
        // Device name used for publishing to Adafruit
        public string DeviceName { get; set; } = string.Empty;
    }

    public class AdafruitOptions
    {
        public string Username { get; set; } = string.Empty;
        public string IoKey { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class SchedulerController : ControllerBase
    {
        private static readonly ConcurrentDictionary<string, DeviceScheduleEntry> _schedules = new ConcurrentDictionary<string, DeviceScheduleEntry>();
        private readonly HttpClient _httpClient;
        private readonly ILogger<SchedulerController> _logger;
        private readonly AdafruitOptions _adafruitOptions;
        private readonly MongoDbService _mongoDbService;

        public SchedulerController(
            HttpClient httpClient, 
            ILogger<SchedulerController> logger,
            IOptions<AdafruitOptions> adafruitOptions,
            MongoDbService mongoDbService)
        {
            _httpClient = httpClient;
            _logger = logger;
            _adafruitOptions = adafruitOptions.Value;
            _mongoDbService = mongoDbService;
            
            // Configure the HttpClient for Adafruit IO API
            _httpClient.BaseAddress = new Uri("https://io.adafruit.com/api/v2/");
            _httpClient.DefaultRequestHeaders.Accept.Clear();
            _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            _httpClient.DefaultRequestHeaders.Add("X-AIO-Key", _adafruitOptions.IoKey);
        }

        [HttpPost("{deviceId}")]
        public async Task<IActionResult> SetSchedule(string deviceId, [FromBody] DeviceScheduleEntry schedule)
        {
            if (schedule == null)
            {
                return BadRequest("Invalid schedule data.");
            }

            schedule.DeviceId = deviceId;

            // Get device name from database
            var device = await _mongoDbService.GetDeviceByIdAsync(deviceId);
            if (device == null)
            {
                return NotFound($"Device with ID '{deviceId}' not found.");
            }

            // Store device name for use in publishing
            schedule.DeviceName = device.Name;

            _schedules.AddOrUpdate(deviceId, schedule, (key, oldValue) => schedule);
            _logger.LogInformation($"Schedule set for device '{deviceId}' (Name: {device.Name}): ON at {schedule.OnTime}, OFF at {schedule.OffTime}");

            return Ok(_schedules[deviceId]);
        }

        [HttpGet("{deviceId}")]
        public ActionResult<DeviceScheduleEntry> GetSchedule(string deviceId)
        {
            if (_schedules.TryGetValue(deviceId, out var schedule))
            {
                return Ok(schedule);
            }
            else
            {
                return NotFound($"Schedule for device '{deviceId}' not found.");
            }
        }

        [HttpDelete("{deviceId}")]
        public IActionResult DeleteSchedule(string deviceId)
        {
            if (_schedules.TryRemove(deviceId, out _))
            {
                _logger.LogInformation($"Schedule for device '{deviceId}' deleted.");
                return Ok($"Schedule for device '{deviceId}' deleted.");
            }
            else
            {
                return NotFound($"Schedule for device '{deviceId}' not found.");
            }
        }

        [HttpPost("{deviceId}/turnon")]
        public async Task<IActionResult> TurnOn(string deviceId)
        {
            try
            {
                var device = await _mongoDbService.GetDeviceByIdAsync(deviceId);
                if (device == null)
                {
                    return NotFound($"Device with ID '{deviceId}' not found.");
                }

                // Use device name as feed name for consistency with frontend
                await PublishToAdafruitFeedAsync(device.Name, "ON");
                return Ok($"Sent ON command to device '{device.Name}'.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending ON command to device '{deviceId}'");
                return StatusCode(500, $"Error sending command: {ex.Message}");
            }
        }

        [HttpPost("{deviceId}/turnoff")]
        public async Task<IActionResult> TurnOff(string deviceId)
        {
            try
            {
                var device = await _mongoDbService.GetDeviceByIdAsync(deviceId);
                if (device == null)
                {
                    return NotFound($"Device with ID '{deviceId}' not found.");
                }

                // Use device name as feed name for consistency with frontend
                await PublishToAdafruitFeedAsync(device.Name, "OFF");
                return Ok($"Sent OFF command to device '{device.Name}'.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending OFF command to device '{deviceId}'");
                return StatusCode(500, $"Error sending command: {ex.Message}");
            }
        }

        // Add a method to get all schedules
        [HttpGet]
        public ActionResult<IEnumerable<DeviceScheduleEntry>> GetAllSchedules()
        {
            return Ok(_schedules.Values);
        }

        private async Task PublishToAdafruitFeedAsync(string deviceName, string value)
        {
            string feedName = deviceName.ToLower().Replace(" ", "_");
            string url = $"{_adafruitOptions.Username}/feeds/{feedName}/data";

            var payload = new
            {
                value = value
            };

            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json");

            try
            {
                // First check if the feed exists, create it if not
                try
                {
                    var checkFeedResponse = await _httpClient.GetAsync($"{_adafruitOptions.Username}/feeds/{feedName}");
                    if (!checkFeedResponse.IsSuccessStatusCode)
                    {
                        _logger.LogInformation($"Feed '{feedName}' not found. Creating new feed.");
                        await CreateFeedAsync(feedName);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, $"Error checking feed '{feedName}'. Attempting to create it.");
                    await CreateFeedAsync(feedName);
                }

                // Now publish the data
                var response = await _httpClient.PostAsync(url, content);
                
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"Published value '{value}' to Adafruit IO feed '{feedName}'");
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Failed to publish to Adafruit IO. Status: {response.StatusCode}, Error: {error}");
                    throw new Exception($"Failed to publish to Adafruit IO: {response.StatusCode} - {error}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error publishing to Adafruit IO feed '{feedName}'");
                throw;
            }
        }

        

        private async Task CreateFeedAsync(string feedName)
        {
            string url = $"{_adafruitOptions.Username}/feeds";

            var payload = new
            {
                feed = new
                {
                    name = feedName,
                    key = feedName
                }
            };

            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json");

            var response = await _httpClient.PostAsync(url, content);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError($"Failed to create feed '{feedName}'. Status: {response.StatusCode}, Error: {error}");
                throw new Exception($"Failed to create feed: {response.StatusCode} - {error}");
            }

            _logger.LogInformation($"Created new Adafruit IO feed '{feedName}'");
        }
    }

    // public class ScheduleBackgroundService : BackgroundService
    // {
    //     private readonly ConcurrentDictionary<string, DeviceScheduleEntry> _schedules;
    //     private readonly ILogger<ScheduleBackgroundService> _logger;
    //     // Track the last known state of each device
    //     private readonly ConcurrentDictionary<string, string> _deviceStates = new();
    //     private readonly IHttpClientFactory _httpClientFactory;
    //     private readonly string _baseUrl;
    //     private readonly MongoDbService _mongoDbService;

    //     public ScheduleBackgroundService(
    //         ConcurrentDictionary<string, DeviceScheduleEntry> schedules,
    //         IHttpClientFactory httpClientFactory,
    //         ILogger<ScheduleBackgroundService> logger,
    //         IConfiguration configuration,
    //         MongoDbService mongoDbService)
    //     {
    //         _schedules = schedules;
    //         _httpClientFactory = httpClientFactory;
    //         _logger = logger;
    //         _mongoDbService = mongoDbService;

    //         // Get the base URL from configuration (if provided) or use default
    //         _baseUrl = configuration["ApiBaseUrl"] ?? "https://localhost:5001";
    //         _logger.LogInformation($"Scheduler using base URL: {_baseUrl}");
    //     }

    //     protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    //     {
    //         _logger.LogInformation("Schedule Background Service is starting.");

    //         // Initial load of device states
    //         await LoadCurrentDeviceStatesAsync(stoppingToken);

    //         while (!stoppingToken.IsCancellationRequested)
    //         {
    //             try
    //             {
    //                 var now = DateTime.Now;
    //                 var currentTime = now.TimeOfDay;
    //                 var currentDayOfWeek = now.DayOfWeek;

    //                 foreach (var entry in _schedules.Values.ToList())
    //                 {
    //                     if (entry.DeviceId == null) continue;

    //                     // Check if schedule should run on current day (if DaysOfWeek is empty, run every day)
    //                     bool runOnThisDay = entry.DaysOfWeek.Count == 0 || entry.DaysOfWeek.Contains(currentDayOfWeek);
    //                     if (!runOnThisDay) continue;

    //                     // For debugging
    //                     _logger.LogDebug($"Checking schedule for device {entry.DeviceId} at {currentTime}, OnTime: {entry.OnTime}, OffTime: {entry.OffTime}");

    //                     // Get the device from MongoDB to ensure we have the current name
    //                     var device = await _mongoDbService.GetDeviceByIdAsync(entry.DeviceId);
    //                     if (device == null)
    //                     {
    //                         _logger.LogWarning($"Device with ID {entry.DeviceId} not found in database. Skipping schedule check.");
    //                         continue;
    //                     }

    //                     // Update device name in schedule if needed
    //                     if (entry.DeviceName != device.Name)
    //                     {
    //                         entry.DeviceName = device.Name;
    //                         _schedules.AddOrUpdate(entry.DeviceId, entry, (key, oldValue) => entry);
    //                     }

    //                     // Check if current time is within 1 minute after OnTime
    //                     if (IsWithinOneMinute(currentTime, entry.OnTime))
    //                     {
    //                         // Only turn on if currently off or state unknown
    //                         if (!_deviceStates.TryGetValue(entry.DeviceId, out var currentState) || currentState != "ON")
    //                         {
    //                             _logger.LogInformation($"[Background Service] Time to turn ON device {device.Name}");
    //                             if (await PublishViaApiEndpointAsync(device.Name, "ON", stoppingToken))
    //                             {
    //                                 // Update local state
    //                                 _deviceStates.AddOrUpdate(entry.DeviceId, "ON", (key, oldValue) => "ON");
                                    
    //                                 // Also update device status in MongoDB
    //                                 await UpdateDeviceStatusInDatabaseAsync(entry.DeviceId, "ON");
    //                             }
    //                         }
    //                         else
    //                         {
    //                             _logger.LogInformation($"[Background Service] Device {device.Name} is already ON, skipping scheduled action");
    //                         }
    //                     }

    //                     // Check if current time is within 1 minute after OffTime
    //                     if (IsWithinOneMinute(currentTime, entry.OffTime))
    //                     {
    //                         // Only turn off if currently on or state unknown
    //                         if (!_deviceStates.TryGetValue(entry.DeviceId, out var currentState) || currentState != "OFF")
    //                         {
    //                             _logger.LogInformation($"[Background Service] Time to turn OFF device {device.Name}");
    //                             if (await PublishViaApiEndpointAsync(device.Name, "OFF", stoppingToken))
    //                             {
    //                                 // Update local state
    //                                 _deviceStates.AddOrUpdate(entry.DeviceId, "OFF", (key, oldValue) => "OFF");
                                    
    //                                 // Also update device status in MongoDB
    //                                 await UpdateDeviceStatusInDatabaseAsync(entry.DeviceId, "OFF");
    //                             }
    //                         }
    //                         else
    //                         {
    //                             _logger.LogInformation($"[Background Service] Device {device.Name} is already OFF, skipping scheduled action");
    //                         }
    //                     }
    //                 }

    //                 // Refresh device states every 5 minutes to ensure local state matches reality
    //                 if (now.Minute % 5 == 0 && now.Second < 30)
    //                 {
    //                     await LoadCurrentDeviceStatesAsync(stoppingToken);
    //                 }

    //                 // Wait for 30 seconds before checking again
    //                 await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
    //             }
    //             catch (OperationCanceledException)
    //             {
    //                 // Service is shutting down - normal behavior
    //                 break;
    //             }
    //             catch (Exception ex)
    //             {
    //                 _logger.LogError(ex, "Error in schedule background service execution.");
    //                 // Wait a bit before trying again
    //                 await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
    //             }
    //         }

    //         _logger.LogInformation("Schedule Background Service is stopping.");
    //     }

    //     private async Task LoadCurrentDeviceStatesAsync(CancellationToken cancellationToken)
    //     {
    //         try
    //         {
    //             _logger.LogInformation("Refreshing current device states from database");
                
    //             // Get all unique device IDs from the schedules
    //             var deviceIds = _schedules.Values
    //                 .Where(s => s.DeviceId != null)
    //                 .Select(s => s.DeviceId!)
    //                 .Distinct()
    //                 .ToList();

    //             foreach (var deviceId in deviceIds)
    //             {
    //                 try
    //                 {
    //                     var device = await _mongoDbService.GetDeviceByIdAsync(deviceId);
    //                     if (device != null)
    //                     {
    //                         _deviceStates.AddOrUpdate(deviceId, device.Status, (key, oldValue) => device.Status);
    //                         _logger.LogInformation($"Updated state for device {device.Name} to {device.Status}");
    //                     }
    //                     else
    //                     {
    //                         _logger.LogWarning($"Device with ID {deviceId} not found in database");
    //                     }
    //                 }
    //                 catch (Exception ex)
    //                 {
    //                     _logger.LogError(ex, $"Error getting state for device {deviceId}");
    //                 }
    //             }
    //         }
    //         catch (Exception ex)
    //         {
    //             _logger.LogError(ex, "Error loading device states");
    //         }
    //     }

    //     private bool IsWithinOneMinute(TimeSpan current, TimeSpan target)
    //     {
    //         // Convert both times to total seconds for easier comparison
    //         double currentSeconds = current.TotalSeconds;
    //         double targetSeconds = target.TotalSeconds;
            
    //         // Check if current time is within 1 minute (60 seconds) after target time
    //         return currentSeconds >= targetSeconds && currentSeconds < targetSeconds + 60;
    //     }

    //     // In DeviceScheduler.cs, update the PublishViaApiEndpointAsync method
    //     private async Task<bool> PublishViaApiEndpointAsync(string deviceName, string value, CancellationToken cancellationToken)
    //     {
    //         int retryCount = 0;
    //         const int maxRetries = 3;
    //         bool published = false;

    //         // Create a client specifically for calling the API
    //         using var httpClient = _httpClientFactory.CreateClient();
            
    //         while (!published && retryCount < maxRetries && !cancellationToken.IsCancellationRequested)
    //         {
    //             try
    //             {
    //                 _logger.LogInformation($"[Background Service] Attempting to publish {value} to device '{deviceName}' (Attempt {retryCount + 1}/{maxRetries})");

    //                 // Create the request to publish to Adafruit MQTT
    //                 var request = new AdafruitPublishRequest
    //                 {
    //                     Feed = deviceName,  // Format feed name to match Adafruit's format
    //                     Payload = value,
    //                     Retain = true,
    //                     QosLevel = 1
    //                 };

    //                 // Send the request to the AdafruitMqttController - fix the URL to use the correct base
    //                 var response = await httpClient.PostAsync($"{_baseUrl}/api/adafruit/publish", 
    //                     new StringContent(
    //                         System.Text.Json.JsonSerializer.Serialize(request),
    //                         System.Text.Encoding.UTF8,
    //                         "application/json"), 
    //                     cancellationToken);
                    
    //                 if (response.IsSuccessStatusCode)
    //                 {
    //                     _logger.LogInformation($"[Background Service] Successfully published value '{value}' to device '{deviceName}'");
    //                     published = true;
    //                 }
    //                 else
    //                 {
    //                     var error = await response.Content.ReadAsStringAsync(cancellationToken);
    //                     _logger.LogError($"[Background Service] Failed to publish to device '{deviceName}'. Status: {response.StatusCode}, Error: {error}");
    //                     retryCount++;
                        
    //                     if (retryCount < maxRetries)
    //                     {
    //                         // Exponential backoff
    //                         await Task.Delay(TimeSpan.FromSeconds(Math.Min(30, Math.Pow(2, retryCount))), cancellationToken);
    //                     }
    //                 }
    //             }
    //             catch (Exception ex)
    //             {
    //                 retryCount++;
    //                 _logger.LogError(ex, $"[Background Service] Error publishing to device '{deviceName}' (Attempt {retryCount}/{maxRetries})");
                    
    //                 if (retryCount < maxRetries)
    //                 {
    //                     await Task.Delay(TimeSpan.FromSeconds(Math.Min(30, Math.Pow(2, retryCount))), cancellationToken);
    //                 }
    //             }
    //         }

    //         return published;
    //     }
        
    //     private async Task UpdateDeviceStatusInDatabaseAsync(string deviceId, string status)
    //     {
    //         try
    //         {
    //             var device = await _mongoDbService.GetDeviceByIdAsync(deviceId);
    //             if (device != null)
    //             {
    //                 // Update device status
    //                 device.Status = status;
    //                 device.LastUpdated = DateTime.UtcNow;
                    
    //                 // // Add history entry
    //                 // device.History.Add(new DeviceHistory
    //                 // {
    //                 //     Timestamp = DateTime.UtcNow,
    //                 //     Status = status,
    //                 //     Consumption = status == "ON" ? GetRandomConsumption() : 0
    //                 // });
                    
    //                 // Update in database
    //                 await _mongoDbService.UpdateDeviceAsync(deviceId, device);
    //                 _logger.LogInformation($"Updated device status in database: {device.Name} -> {status}");
    //             }
    //         }
    //         catch (Exception ex)
    //         {
    //             _logger.LogError(ex, $"Error updating device status in database for device {deviceId}");
    //         }
    //     }
        
    //     private double GetRandomConsumption()
    //     {
    //         Random random = new Random();
    //         return Math.Round(random.NextDouble() * 100, 2);
    //     }
    // }

    // // Extension method to register our services with the updated dependencies
    // public static class SchedulerServicesExtensions
    // {
    //     public static IServiceCollection AddSchedulerServices(this IServiceCollection services, IConfiguration configuration)
    //     {
    //         // Register Adafruit options
    //         services.Configure<AdafruitOptions>(configuration.GetSection("Adafruit"));
            
    //         // Register HttpClient factory
    //         services.AddHttpClient();

    //         // Register schedules dictionary as singleton
    //         services.AddSingleton<ConcurrentDictionary<string, DeviceScheduleEntry>>();

    //         // Register background service
    //         services.AddHostedService<ScheduleBackgroundService>();

    //         return services;
    //     }
    // }

    
}

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
using System.Linq;
using MyIoTPlatform.Application.Interfaces.Communication;


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
        private readonly ILogger<SchedulerController> _logger;
        private readonly AdafruitOptions _adafruitOptions;
        private readonly MongoDbService _mongoDbService;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IMqttClientService _mqttClientService; // Added MQTT client service

        public SchedulerController(
            IHttpClientFactory httpClientFactory,
            ILogger<SchedulerController> logger,
            IOptions<AdafruitOptions> adafruitOptions,
            MongoDbService mongoDbService,
            IMqttClientService mqttClientService) // Added MQTT client service to constructor
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
            _adafruitOptions = adafruitOptions.Value;
            _mongoDbService = mongoDbService;
            _mqttClientService = mqttClientService;
        }

        private HttpClient CreateAdafruitHttpClient()
        {
            var httpClient = _httpClientFactory.CreateClient("AdafruitClient");
            httpClient.BaseAddress = new Uri("https://io.adafruit.com/api/v2/");
            httpClient.DefaultRequestHeaders.Accept.Clear();
            httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            httpClient.DefaultRequestHeaders.Add("X-AIO-Key", _adafruitOptions.IoKey);
            return httpClient;
        }

        [HttpPost("{deviceId}")]
        public async Task<IActionResult> SetSchedule(string deviceId, [FromBody] DeviceScheduleEntry schedule)
        {
            if (schedule == null)
            {
                return BadRequest("Invalid schedule data.");
            }

            schedule.DeviceId = deviceId;

            try
            {
                // Get device name from database
                var device = await _mongoDbService.GetDeviceByIdAsync(deviceId);
                if (device == null)
                {
                    return NotFound($"Device with ID '{deviceId}' not found.");
                }

                // Store device name for use in publishing
                schedule.DeviceName = device.Name;

                // Store the schedule in memory dictionary
                _schedules.AddOrUpdate(deviceId, schedule, (key, oldValue) => schedule);
                
                _logger.LogInformation($"Schedule set for device '{deviceId}' (Name: {device.Name}): ON at {schedule.OnTime}, OFF at {schedule.OffTime}");

                // Calculate time until ON and OFF events
                var now = DateTime.Now;
                var onTimeParts = schedule.OnTime.ToString().Split(':');
                var offTimeParts = schedule.OffTime.ToString().Split(':');
                
                if (onTimeParts.Length < 2 || offTimeParts.Length < 2)
                {
                    return BadRequest("Invalid time format. Use HH:mm format.");
                }

                var onHour = int.Parse(onTimeParts[0]);
                var onMinute = int.Parse(onTimeParts[1]);
                
                var offHour = int.Parse(offTimeParts[0]);
                var offMinute = int.Parse(offTimeParts[1]);

                var onTime = new DateTime(now.Year, now.Month, now.Day, onHour, onMinute, 0);
                var offTime = new DateTime(now.Year, now.Month, now.Day, offHour, offMinute, 0);

                // If the scheduled time has already passed today, set it for tomorrow
                if (onTime < now)
                {
                    onTime = onTime.AddDays(1);
                }
                
                if (offTime < now)
                {
                    offTime = offTime.AddDays(1);
                }
                
                // Check for days of week restrictions
                if (schedule.DaysOfWeek.Count > 0)
                {
                    // Adjust onTime to the next day that matches the schedule
                    while (!schedule.DaysOfWeek.Contains((DayOfWeek)(int)onTime.DayOfWeek))
                    {
                        onTime = onTime.AddDays(1);
                    }
                    
                    // Adjust offTime to the next day that matches the schedule
                    while (!schedule.DaysOfWeek.Contains((DayOfWeek)(int)offTime.DayOfWeek))
                    {
                        offTime = offTime.AddDays(1);
                    }
                }

                // Calculate time delays until scheduled events
                var timeUntilOn = onTime - now;
                var timeUntilOff = offTime - now;

                _logger.LogInformation($"Device '{device.Name}': Scheduled ON in {timeUntilOn.TotalMinutes:0.0} minutes, OFF in {timeUntilOff.TotalMinutes:0.0} minutes");

                // Set up timers for ON and OFF events (immediate scheduling)
                // Note: In a production app, these would be persisted and recovered on service restart
                
                // Schedule the ON event
                _ = Task.Run(async () => 
                {
                    try
                    {
                        await Task.Delay(timeUntilOn);
                        
                        // Check if this is still the active schedule before executing
                        if (_schedules.TryGetValue(deviceId, out var currentSchedule) && 
                            currentSchedule.OnTime.Equals(schedule.OnTime) && 
                            currentSchedule.OffTime.Equals(schedule.OffTime))
                        {
                            string feedName = device.Name.ToLower().Replace(" ", "_");
                            _logger.LogInformation($"Executing scheduled ON for device '{device.Name}' on feed '{feedName}'");
                            
                            // Use MQTT client service instead of HTTP
                            await _mqttClientService.PublishAsync(feedName, "ON", true, 1);
                            
                            // Also update device status in database
                            await _mongoDbService.ControlDeviceAsync(deviceId, "ON");
                            
                            _logger.LogInformation($"Successfully turned ON device '{device.Name}' according to schedule");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error executing scheduled ON for device '{device.Name}'");
                    }
                });
                
                // Schedule the OFF event
                _ = Task.Run(async () => 
                {
                    try
                    {
                        await Task.Delay(timeUntilOff);
                        
                        // Check if this is still the active schedule before executing
                        if (_schedules.TryGetValue(deviceId, out var currentSchedule) && 
                            currentSchedule.OnTime.Equals(schedule.OnTime) && 
                            currentSchedule.OffTime.Equals(schedule.OffTime))
                        {
                            string feedName = device.Name.ToLower().Replace(" ", "_");
                            _logger.LogInformation($"Executing scheduled OFF for device '{device.Name}' on feed '{feedName}'");
                            
                            // Use MQTT client service instead of HTTP
                            await _mqttClientService.PublishAsync(feedName, "OFF", true, 1);
                            
                            // Also update device status in database
                            await _mongoDbService.ControlDeviceAsync(deviceId, "OFF");
                            
                            _logger.LogInformation($"Successfully turned OFF device '{device.Name}' according to schedule");
                            
                            // If days of week is specified, reschedule for the next occurrence
                            if (schedule.DaysOfWeek.Count > 0)
                            {
                                // Reschedule for next week
                                var nextOnTime = onTime.AddDays(7);
                                var nextOffTime = offTime.AddDays(7);
                                
                                _logger.LogInformation($"Rescheduling device '{device.Name}': Next ON at {nextOnTime}, OFF at {nextOffTime}");
                                
                                // Create a new schedule for the next occurrence
                                var newSchedule = new DeviceScheduleEntry
                                {
                                    DeviceId = deviceId,
                                    DeviceName = device.Name,
                                    OnTime = schedule.OnTime,
                                    OffTime = schedule.OffTime,
                                    DaysOfWeek = schedule.DaysOfWeek
                                };
                                
                                // Update the schedule in memory
                                _schedules.AddOrUpdate(deviceId, newSchedule, (key, oldValue) => newSchedule);
                                
                                // Recursively call this method to schedule the next occurrence
                                var requestUri = $"{Request.Scheme}://{Request.Host}/api/scheduler/{deviceId}";
                                using (var httpClient = new HttpClient())
                                {
                                    // Add authorization header if needed
                                    var authHeader = Request.Headers["Authorization"].FirstOrDefault();
                                    if (!string.IsNullOrEmpty(authHeader))
                                    {
                                        httpClient.DefaultRequestHeaders.Add("Authorization", authHeader);
                                    }
                                    
                                    var content = new StringContent(
                                        JsonSerializer.Serialize(newSchedule),
                                        Encoding.UTF8,
                                        "application/json");
                                    
                                    await httpClient.PostAsync(requestUri, content);
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error executing scheduled OFF for device '{device.Name}'");
                    }
                });

                // Also save schedule to database for persistence across restarts
                // Create a database schedule object with a different name to avoid conflicts
                var dbScheduleData = new Models.DeviceSchedule
                {
                    DeviceId = deviceId,
                    UserId = device.UserIds.FirstOrDefault() ?? "",  // Use first user ID or empty string
                    OnTime = schedule.OnTime.ToString(),
                    OffTime = schedule.OffTime.ToString(),
                    DaysOfWeek = schedule.DaysOfWeek.Select(day => (int)day).ToList(), // Convert DayOfWeek enum to int
                    AdafruitFeed = device.Name.ToLower().Replace(" ", "_"),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Check if a schedule already exists
                var existingSchedule = await _mongoDbService.GetScheduleByDeviceIdAsync(deviceId);
                if (existingSchedule != null)
                {
                    // Update existing schedule
                    dbScheduleData.Id = existingSchedule.Id;
                    await _mongoDbService.UpdateScheduleAsync(existingSchedule.Id, dbScheduleData);
                }
                else
                {
                    // Create new schedule
                    await _mongoDbService.CreateScheduleAsync(dbScheduleData);
                }

                return Ok(new {
                    Schedule = _schedules[deviceId],
                    NextOnTime = onTime,
                    NextOffTime = offTime,
                    TimeUntilOn = $"{timeUntilOn.Hours}h {timeUntilOn.Minutes}m {timeUntilOn.Seconds}s",
                    TimeUntilOff = $"{timeUntilOff.Hours}h {timeUntilOff.Minutes}m {timeUntilOff.Seconds}s"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error setting schedule for device '{deviceId}'");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
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

                string feedName = device.Name.ToLower().Replace(" ", "_");
                _logger.LogInformation($"Turning ON device '{device.Name}' using feed '{feedName}'");
                
                // Use MQTT client service instead of HTTP
                await _mqttClientService.PublishAsync(feedName, "ON", true, 1);
                
                // Update device status in database
                await _mongoDbService.ControlDeviceAsync(deviceId, "ON");
                
                return Ok(new { message = $"Sent ON command to device '{device.Name}'." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending ON command to device '{deviceId}'");
                return StatusCode(500, new { message = $"Error sending command: {ex.Message}" });
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

                string feedName = device.Name.ToLower().Replace(" ", "_");
                _logger.LogInformation($"Turning OFF device '{device.Name}' using feed '{feedName}'");
                
                // Use MQTT client service instead of HTTP
                await _mqttClientService.PublishAsync(feedName, "OFF", true, 1);
                
                // Update device status in database
                await _mongoDbService.ControlDeviceAsync(deviceId, "OFF");
                
                return Ok(new { message = $"Sent OFF command to device '{device.Name}'." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending OFF command to device '{deviceId}'");
                return StatusCode(500, new { message = $"Error sending command: {ex.Message}" });
            }
        }

        // Add a method to get all schedules
        [HttpGet]
        public ActionResult<IEnumerable<DeviceScheduleEntry>> GetAllSchedules()
        {
            return Ok(_schedules.Values);
        }

        // We can keep this method for API-based feed creation if needed
        private async Task EnsureFeedExistsAsync(string feedName)
        {
            try
            {
                using (var httpClient = CreateAdafruitHttpClient())
                {
                    // Check if feed exists first
                    var checkResponse = await httpClient.GetAsync($"{_adafruitOptions.Username}/feeds/{feedName}");
                    
                    if (checkResponse.IsSuccessStatusCode)
                    {
                        _logger.LogInformation($"Feed '{feedName}' already exists");
                        return;
                    }
                    
                    // Feed doesn't exist, create it
                    _logger.LogInformation($"Creating feed '{feedName}'");
                    
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
                    
                    var response = await httpClient.PostAsync($"{_adafruitOptions.Username}/feeds", content);
                    
                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation($"Successfully created feed '{feedName}'");
                    }
                    else
                    {
                        var errorContent = await response.Content.ReadAsStringAsync();
                        _logger.LogWarning($"Failed to create feed '{feedName}': {response.StatusCode} - {errorContent}");
                        
                        // If 422 error (feed might exist with different name/key), get all feeds
                        if (response.StatusCode == System.Net.HttpStatusCode.UnprocessableEntity)
                        {
                            _logger.LogInformation("Listing all feeds to check if it exists with a different key");
                            var feedsResponse = await httpClient.GetAsync($"{_adafruitOptions.Username}/feeds");
                            if (feedsResponse.IsSuccessStatusCode)
                            {
                                var feedsContent = await feedsResponse.Content.ReadAsStringAsync();
                                _logger.LogInformation($"Available feeds: {feedsContent}");
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error ensuring feed '{feedName}' exists");
            }
        }

        // This method is now optional and can be used to initialize feeds before using MQTT
        [HttpPost("initialize-feed/{feedName}")]
        public async Task<IActionResult> InitializeFeed(string feedName)
        {
            if (string.IsNullOrEmpty(feedName))
            {
                return BadRequest("Feed name is required");
            }
            
            try
            {
                await EnsureFeedExistsAsync(feedName);
                return Ok(new { message = $"Feed '{feedName}' initialized successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error initializing feed '{feedName}'");
                return StatusCode(500, new { message = $"Error: {ex.Message}" });
            }
        }
    }

    // Rename this class to avoid conflict with Models.DeviceSchedule
    internal class ScheduleDbModel
    {
        public string Id { get; set; }
        public string DeviceId { get; set; }
        public string UserId { get; set; }
        public string OnTime { get; set; }
        public string OffTime { get; set; }
        public List<DayOfWeek> DaysOfWeek { get; set; }
        public string AdafruitFeed { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
using Microsoft.AspNetCore.Mvc;
using MQTTnet;
using MQTTnet.Client;
using MQTTnet.Protocol;
using System.Text;
using System.Collections.Concurrent;
using Microsoft.Extensions.DependencyInjection;

namespace MyIoTPlatform.API.Controllers
{
    public class DeviceScheduleEntry
    {
        public string? DeviceId { get; set; }
        public TimeSpan OnTime { get; set; }
        public TimeSpan OffTime { get; set; }
        // Add DaysOfWeek property to support scheduling on specific days
        public List<DayOfWeek> DaysOfWeek { get; set; } = new List<DayOfWeek>();
    }

    [ApiController]
    [Route("api/[controller]")]  // This ensures only one "api" in the path
    public class SchedulerController : ControllerBase
    {
        private static readonly ConcurrentDictionary<string, DeviceScheduleEntry> _schedules = new ConcurrentDictionary<string, DeviceScheduleEntry>();
        private readonly IMqttClient _mqttClient;
        private readonly ILogger<SchedulerController> _logger;

        public SchedulerController(IMqttClient mqttClient, ILogger<SchedulerController> logger)
        {
            _mqttClient = mqttClient;
            _logger = logger;
        }

        [HttpPost("{deviceId}")]
        public IActionResult SetSchedule(string deviceId, [FromBody] DeviceScheduleEntry schedule)
        {
            if (schedule == null)
            {
                return BadRequest("Invalid schedule data.");
            }

            schedule.DeviceId = deviceId;

            _schedules.AddOrUpdate(deviceId, schedule, (key, oldValue) => schedule);
            _logger.LogInformation($"Schedule set for device '{deviceId}': ON at {schedule.OnTime}, OFF at {schedule.OffTime}");

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
                await PublishMqttMessageAsync($"devices/{deviceId}/command", "ON");
                return Ok($"Sent ON command to device '{deviceId}'.");
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
                await PublishMqttMessageAsync($"devices/{deviceId}/command", "OFF");
                return Ok($"Sent OFF command to device '{deviceId}'.");
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

        private async Task PublishMqttMessageAsync(string topic, string payload)
        {
            if (!_mqttClient.IsConnected)
            {
                _logger.LogWarning("MQTT client is not connected. Attempting to reconnect...");
                try
                {
                    var options = new MqttClientOptionsBuilder()
                        .WithClientId("api-controller-" + Guid.NewGuid().ToString().Substring(0, 8))
                        .WithTcpServer("192.168.1.9", 1883)
                        .WithCleanSession()
                        .Build();

                    await _mqttClient.ConnectAsync(options, CancellationToken.None);
                    _logger.LogInformation("MQTT client connected.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "MQTT connection failed.");
                    throw;
                }
            }

            var message = new MqttApplicationMessageBuilder()
                .WithTopic(topic)
                .WithPayload(Encoding.UTF8.GetBytes(payload))
                .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
                .Build();

            await _mqttClient.PublishAsync(message, CancellationToken.None);
            _logger.LogInformation($"Published message to topic '{topic}': '{payload}'");
        }
    }

    public class ScheduleBackgroundService : BackgroundService
    {
        private readonly ConcurrentDictionary<string, DeviceScheduleEntry> _schedules;
        private readonly IMqttClient _mqttClient;
        private readonly MqttClientOptions _mqttOptions;
        private readonly ILogger<ScheduleBackgroundService> _logger;

        public ScheduleBackgroundService(
            ConcurrentDictionary<string, DeviceScheduleEntry> schedules,
            IMqttClient mqttClient,
            ILogger<ScheduleBackgroundService> logger)
        {
            _schedules = schedules;
            _mqttClient = mqttClient;
            _mqttOptions = new MqttClientOptionsBuilder()
                .WithClientId("schedule-service-" + Guid.NewGuid().ToString().Substring(0, 8))
                .WithTcpServer("192.168.1.9", 1883)
                .WithCleanSession()
                .Build();
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Schedule Background Service is starting.");

            // First connect to MQTT broker
            await ConnectToMqttBrokerAsync();

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

                        // Check if current time is within 1 minute after OnTime
                        if (IsWithinOneMinute(currentTime, entry.OnTime))
                        {
                            _logger.LogInformation($"[Background Service] Time to turn ON device {entry.DeviceId}");
                            await PublishMqttMessageAsync($"devices/{entry.DeviceId}/command", "ON");
                        }

                        // Check if current time is within 1 minute after OffTime
                        if (IsWithinOneMinute(currentTime, entry.OffTime))
                        {
                            _logger.LogInformation($"[Background Service] Time to turn OFF device {entry.DeviceId}");
                            await PublishMqttMessageAsync($"devices/{entry.DeviceId}/command", "OFF");
                        }
                    }

                    // Wait for 30 seconds before checking again (increased check frequency for better accuracy)
                    await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
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

        private bool IsWithinOneMinute(TimeSpan current, TimeSpan target)
        {
            // Convert both times to total seconds for easier comparison
            double currentSeconds = current.TotalSeconds;
            double targetSeconds = target.TotalSeconds;
            
            // Check if current time is within 1 minute (60 seconds) after target time
            return currentSeconds >= targetSeconds && currentSeconds < targetSeconds + 60;
        }

        private async Task ConnectToMqttBrokerAsync()
        {
            // Sử dụng SemaphoreSlim để kiểm soát các yêu cầu kết nối đồng thời
            SemaphoreSlim connectionSemaphore = new SemaphoreSlim(1, 1);

            _mqttClient.DisconnectedAsync += async e =>
            {
                _logger.LogWarning("MQTT client disconnected. Trying to reconnect in 5 seconds...");
                await Task.Delay(TimeSpan.FromSeconds(5));
                
                // Sử dụng semaphore để đảm bảo chỉ một yêu cầu kết nối tại một thời điểm
                try
                {
                    // Chờ semaphore, với timeout 10s để tránh deadlock
                    bool acquired = await connectionSemaphore.WaitAsync(TimeSpan.FromSeconds(10));
                    if (!acquired)
                    {
                        _logger.LogWarning("Could not acquire connection lock, reconnection attempt skipped.");
                        return;
                    }

                    try
                    {
                        // Kiểm tra trạng thái kết nối trước khi thử kết nối lại
                        if (!_mqttClient.IsConnected)
                        {
                            await _mqttClient.ConnectAsync(_mqttOptions, CancellationToken.None);
                            _logger.LogInformation("MQTT client reconnected.");
                        }
                    }
                    finally
                    {
                        connectionSemaphore.Release();
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "MQTT reconnection failed.");
                }
            };

            try
            {
                // Đảm bảo lần kết nối đầu tiên cũng dùng semaphore
                await connectionSemaphore.WaitAsync();
                try
                {
                    if (!_mqttClient.IsConnected)
                    {
                        await _mqttClient.ConnectAsync(_mqttOptions, CancellationToken.None);
                        _logger.LogInformation("MQTT client connected.");
                    }
                }
                finally
                {
                    connectionSemaphore.Release();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Initial MQTT connection failed.");
            }
        }

        private async Task PublishMqttMessageAsync(string topic, string payload)
        {
            if (!_mqttClient.IsConnected)
            {
                _logger.LogWarning("[Background Service] MQTT client is not connected. Attempting to reconnect...");
                try
                {
                    await _mqttClient.ConnectAsync(_mqttOptions, CancellationToken.None);
                    _logger.LogInformation("[Background Service] MQTT client reconnected.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[Background Service] MQTT reconnection failed.");
                    return;
                }
            }

            var message = new MqttApplicationMessageBuilder()
                .WithTopic(topic)
                .WithPayload(Encoding.UTF8.GetBytes(payload))
                .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
                .Build();

            try
            {
                await _mqttClient.PublishAsync(message, CancellationToken.None);
                _logger.LogInformation($"[Background Service] Published message to topic '{topic}': '{payload}'");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[Background Service] Failed to publish message to topic '{topic}'.");
            }
        }
    }

    // Extension method to register our services
    public static class SchedulerServicesExtensions
    {
        public static IServiceCollection AddSchedulerServices(this IServiceCollection services)
        {
            // Register MQTT client as singleton
            services.AddSingleton(sp => 
            {
                var factory = new MqttFactory();
                return factory.CreateMqttClient();
            });

            // Register schedules dictionary as singleton
            services.AddSingleton<ConcurrentDictionary<string, DeviceScheduleEntry>>();

            // Register background service
            services.AddHostedService<ScheduleBackgroundService>();

            return services;
        }
    }
}
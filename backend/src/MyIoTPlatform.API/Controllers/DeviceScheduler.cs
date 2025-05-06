using Microsoft.AspNetCore.Mvc;
using MQTTnet;
using MQTTnet.Client;
using MQTTnet.Protocol;
using System.Text;
using System.Collections.Concurrent;

namespace MyIoTPlatform.API.Controllers
{
    public class DeviceScheduleEntry
    {
        public string? DeviceId { get; set; }
        public TimeSpan OnTime { get; set; }
        public TimeSpan OffTime { get; set; }
    }

    [ApiController]
    [Route("api/scheduler/{deviceId}")]
    public class DeviceScheduler : ControllerBase
    {
        private static readonly ConcurrentDictionary<string, DeviceScheduleEntry> _schedules = new ConcurrentDictionary<string, DeviceScheduleEntry>();

        private static readonly IMqttClient _mqttClient;
        private static readonly MqttClientOptions _mqttOptions;

        static DeviceScheduler()
        {
            var factory = new MqttFactory();
            _mqttClient = factory.CreateMqttClient();

            _mqttOptions = new MqttClientOptionsBuilder()
                .WithClientId("api-scheduler-controller")
                .WithTcpServer("192.168.1.9", 1883)
                .WithCleanSession()
                .Build();

            _mqttClient.DisconnectedAsync += async e =>
            {
                Console.WriteLine("MQTT client disconnected. Trying to reconnect in 5 seconds...");
                await Task.Delay(TimeSpan.FromSeconds(5));
                try
                {
                    await ConnectMqttClientAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"MQTT reconnection failed: {ex.Message}");
                }
            };

            ConnectMqttClientAsync().GetAwaiter().GetResult();
        }

        private static async Task ConnectMqttClientAsync()
        {
             if (!_mqttClient.IsConnected)
            {
                try
                {
                    await _mqttClient.ConnectAsync(_mqttOptions, CancellationToken.None);
                    Console.WriteLine("MQTT client connected.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"MQTT connection failed: {ex.Message}");
                }
            }
        }

        private async Task PublishMqttMessageAsync(string topic, string payload)
        {
            if (!_mqttClient.IsConnected)
            {
                 await ConnectMqttClientAsync();
            }

            if (_mqttClient.IsConnected)
            {
                var message = new MqttApplicationMessageBuilder()
                    .WithTopic(topic)
                    .WithPayload(Encoding.UTF8.GetBytes(payload))
                    .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
                    .Build();

                await _mqttClient.PublishAsync(message, CancellationToken.None);
                Console.WriteLine($"Published message from Controller to topic '{topic}': '{payload}'");
            }
            else
            {
                Console.WriteLine("MQTT client is not connected. Cannot publish message from Controller.");
            }
        }

        [HttpPost]
        public IActionResult SetSchedule(string deviceId, [FromBody] DeviceScheduleEntry schedule)
        {
            if (schedule == null)
            {
                return BadRequest("Invalid schedule data.");
            }

            schedule.DeviceId = deviceId;

            _schedules.AddOrUpdate(deviceId, schedule, (key, oldValue) => schedule);

            return Ok(_schedules[deviceId]);
        }

        [HttpGet]
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

        [HttpDelete]
        public IActionResult DeleteSchedule(string deviceId)
        {
            if (_schedules.TryRemove(deviceId, out _))
            {
                return Ok($"Schedule for device '{deviceId}' deleted.");
            }
            else
            {
                return NotFound($"Schedule for device '{deviceId}' not found.");
            }
        }

        [HttpPost("turnon")]
        public async Task<IActionResult> TurnOn(string deviceId)
        {
            await PublishMqttMessageAsync($"devices/{deviceId}/command", "ON");
            return Ok($"Sent ON command to device '{deviceId}'.");
        }

        [HttpPost("turnoff")]
        public async Task<IActionResult> TurnOff(string deviceId)
        {
            await PublishMqttMessageAsync($"devices/{deviceId}/command", "OFF");
            return Ok($"Sent OFF command to device '{deviceId}'.");
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
            MqttClientOptions mqttOptions,
            ILogger<ScheduleBackgroundService> logger)
        {
            _schedules = schedules;
            _mqttClient = mqttClient;
            _mqttOptions = mqttOptions;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Schedule Background Service is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                var now = DateTime.Now.TimeOfDay;

                foreach (var entry in _schedules.Values.ToList())
                {
                    if (entry.DeviceId == null) continue;

                    // Check if current time is within 1 minute after OnTime
                    if (now >= entry.OnTime && now < entry.OnTime.Add(TimeSpan.FromMinutes(1)))
                    {
                        _logger.LogInformation($"[Background Service] Time to turn ON device {entry.DeviceId}");
                        await PublishMqttMessageAsync($"devices/{entry.DeviceId}/command", "ON");
                    }

                    // Check if current time is within 1 minute after OffTime
                     if (now >= entry.OffTime && now < entry.OffTime.Add(TimeSpan.FromMinutes(1)))
                    {
                        _logger.LogInformation($"[Background Service] Time to turn OFF device {entry.DeviceId}");
                        await PublishMqttMessageAsync($"devices/{entry.DeviceId}/command", "OFF");
                    }
                }

                // Wait for 1 minute before checking again
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }

            _logger.LogInformation("Schedule Background Service is stopping.");
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

             if (_mqttClient.IsConnected)
             {
                 var message = new MqttApplicationMessageBuilder()
                     .WithTopic(topic)
                     .WithPayload(Encoding.UTF8.GetBytes(payload))
                     .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
                     .Build();

                 try
                 {
                     await _mqttClient.PublishAsync(message, CancellationToken.None);
                     _logger.LogInformation($"[Background Service] Published message from Background Service to topic '{topic}': '{payload}'");
                 }
                 catch (Exception ex)
                 {
                     _logger.LogError(ex, $"[Background Service] Failed to publish message to topic '{topic}'.");
                 }
             }
             else
             {
                  _logger.LogWarning("[Background Service] MQTT client is still not connected. Cannot publish message from Background Service.");
             }
         }
    }
}

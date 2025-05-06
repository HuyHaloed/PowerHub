//File: DeviceControlController.cs
using Microsoft.AspNetCore.Mvc;
using MQTTnet;
using MQTTnet.Client;
using MQTTnet.Protocol;
using System.Text;

namespace MyIoTPlatform.API.Controllers
{
    [ApiController]
    [Route("api/devices/{deviceId}")]
    public class DeviceControlController : ControllerBase
    {
        private static readonly IMqttClient _mqttClient;
        private static readonly MqttClientOptions _mqttOptions;


        static DeviceControlController()
        {
            var factory = new MqttFactory();
            _mqttClient = factory.CreateMqttClient();

            _mqttOptions = new MqttClientOptionsBuilder()
                .WithClientId("api-controller")
                .WithTcpServer("192.168.1.9", 1883)
                .Build();
        }

        private async Task EnsureConnectedAsync()
        {
            if (!_mqttClient.IsConnected)
            {
                await _mqttClient.ConnectAsync(_mqttOptions, CancellationToken.None);
            }
        }

        [HttpPost("fan")]
        public async Task<IActionResult> ControlFan(string deviceId, [FromQuery] bool state)
        {
            await EnsureConnectedAsync();

            string topic = $"devices/{deviceId}/fan/set";
            string payload = state ? "true" : "false";

            var message = new MqttApplicationMessageBuilder()
                .WithTopic(topic)
                .WithPayload(payload)
                .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
                .Build();

            await _mqttClient.PublishAsync(message, CancellationToken.None);
            return Ok(new { deviceId, fan = state });
        }

        [HttpPost("light")]
        public async Task<IActionResult> ControlLight(string deviceId, [FromQuery] bool state)
        {
            await EnsureConnectedAsync();

            string topic = $"devices/{deviceId}/light/set";
            string payload = state ? "true" : "false";

            var message = new MqttApplicationMessageBuilder()
                .WithTopic(topic)
                .WithPayload(payload)
                .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
                .Build();

            await _mqttClient.PublishAsync(message, CancellationToken.None);
            return Ok(new { deviceId, light = state });
        }
        private async Task PublishMqttMessage(string topic, string payload)
        {
            if (!_mqttClient.IsConnected)
            {
                await _mqttClient.ConnectAsync(_mqttOptions, CancellationToken.None);
            }

            var message = new MqttApplicationMessageBuilder()
                .WithTopic(topic)
                .WithPayload(Encoding.UTF8.GetBytes(payload))
                .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
                .Build();

            await _mqttClient.PublishAsync(message, CancellationToken.None);
        }
    }
}

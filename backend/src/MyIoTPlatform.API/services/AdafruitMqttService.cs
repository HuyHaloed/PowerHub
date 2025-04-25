using System;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

using MQTTnet;
using MQTTnet.Client;

using MQTTnet.Protocol;
using MyIoTPlatform.Application.Interfaces.Communication;

namespace MyIoTPlatform.API.Services
{
    public class AdafruitMqttService : IMqttClientService, IHostedService
    {
        private readonly ILogger<AdafruitMqttService> _logger;
        private readonly IConfiguration _configuration;
        private IMqttClient _mqttClient;
        private bool _isConnected;
        
        private readonly string _adafruitUsername;
        private readonly string _adafruitIoKey;
        private readonly string _brokerUrl;

        public AdafruitMqttService(ILogger<AdafruitMqttService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
            
            // Get Adafruit configuration
            _adafruitUsername = _configuration["Adafruit:Username"] ?? "YOUR_ADAFRUIT_USERNAME";
            _adafruitIoKey = _configuration["Adafruit:IoKey"] ?? "YOUR_ADAFRUIT_IO_KEY";
            _brokerUrl = "io.adafruit.com";
            
            _isConnected = false;
            
            // Create MQTT client instance
            var factory = new MqttFactory();
            _mqttClient = factory.CreateMqttClient();
            
            // Set up client event handlers using UseXxx extension methods
            _mqttClient.ConnectedAsync += async e =>
            {
                _isConnected = true;
                _logger.LogInformation("Connected to Adafruit IO MQTT Broker");
                await Task.CompletedTask;
            };

            _mqttClient.DisconnectedAsync += async e =>
            {
                _isConnected = false;
                _logger.LogWarning("Disconnected from Adafruit IO MQTT Broker");

                // Try to reconnect when disconnected
                await Task.Delay(TimeSpan.FromSeconds(5));
                await ConnectAsync();
            };

            
            _mqttClient.ApplicationMessageReceivedAsync += e =>
            {
                Console.WriteLine($"Received message: {e.ApplicationMessage.Topic}");
                return Task.CompletedTask;
            };
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            await ConnectAsync();
        }

        public async Task StopAsync(CancellationToken cancellationToken)
        {
            if (_mqttClient != null && _isConnected)
            {
                await _mqttClient.DisconnectAsync();
            }
        }

        private async Task ConnectAsync()
        {
            try
            {
                var options = new MqttClientOptionsBuilder()
                    .WithTcpServer(_brokerUrl, 8883) // TLS secure connection
                    .WithTls()
                    .WithCredentials(_adafruitUsername, _adafruitIoKey)
                    .WithClientId($"MyIoTPlatform_{Guid.NewGuid()}")
                    .WithCleanSession()
                    .Build();
                
                await _mqttClient.ConnectAsync(options);
                _logger.LogInformation("Connected to Adafruit IO MQTT Broker");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to connect to Adafruit IO MQTT Broker");
                
                // Retry connection after delay
                await Task.Delay(TimeSpan.FromSeconds(10));
                await ConnectAsync();
            }
        }

        public async Task PublishAsync(string topic, string payload, bool retain = false, int qosLevel = 1)
        {
            try
            {
                if (!_isConnected)
                {
                    await ConnectAsync();
                }
                
                // Format topic for Adafruit IO (username/feeds/feed-name)
                string formattedTopic = topic;
                if (!topic.StartsWith(_adafruitUsername))
                {
                    formattedTopic = $"{_adafruitUsername}/feeds/{topic}";
                }
                
                var message = new MqttApplicationMessageBuilder()
                    .WithTopic(formattedTopic)
                    .WithPayload(payload)
                    .WithQualityOfServiceLevel((MqttQualityOfServiceLevel)qosLevel)
                    .WithRetainFlag(retain)
                    .Build();
                
                await _mqttClient.PublishAsync(message);
                _logger.LogInformation($"Published message to {formattedTopic}: {payload}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to publish message to {topic}");
                throw;
            }
        }

        public async Task SubscribeAsync(string topic)
        {
            try
            {
                if (!_isConnected)
                {
                    await ConnectAsync();
                }
                
                // Format topic for Adafruit IO (username/feeds/feed-name)
                string formattedTopic = topic;
                if (!topic.StartsWith(_adafruitUsername))
                {
                    formattedTopic = $"{_adafruitUsername}/feeds/{topic}";
                }
                
                // Use TopicFilterBuilder for subscribing
                var topicFilter = new MqttTopicFilterBuilder()
                    .WithTopic(formattedTopic)
                    .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
                    .Build();
                
                await _mqttClient.SubscribeAsync(topicFilter);
                _logger.LogInformation($"Subscribed to topic: {formattedTopic}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to subscribe to topic: {topic}");
                throw;
            }
        }

        public async Task UnsubscribeAsync(string topic)
        {
            try
            {
                if (!_isConnected)
                {
                    await ConnectAsync();
                }
                
                // Format topic for Adafruit IO (username/feeds/feed-name)
                string formattedTopic = topic;
                if (!topic.StartsWith(_adafruitUsername))
                {
                    formattedTopic = $"{_adafruitUsername}/feeds/{topic}";
                }
                
                await _mqttClient.UnsubscribeAsync(formattedTopic);
                _logger.LogInformation($"Unsubscribed from topic: {formattedTopic}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to unsubscribe from topic: {topic}");
                throw;
            }
        }
    }
}
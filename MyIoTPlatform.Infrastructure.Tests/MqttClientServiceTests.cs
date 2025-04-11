using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using MyIoTPlatform.Infrastructure.Communication.Mqtt;
using NUnit.Framework;
using System;
using System.Threading.Tasks;

namespace MyIoTPlatform.Infrastructure.Tests
{
    public class MqttClientServiceTests
    {
        [Test]
        public async Task PublishAsync_ClientNotStarted_LogsWarning()
        {
            // Arrange
            var mockLogger = new Mock<ILogger<MqttClientService>>();
            var mockOptions = new Mock<IOptions<MqttConfig>>();
            var mqttConfig = new MqttConfig { Host = "localhost", Port = 1883 };
            mockOptions.Setup(o => o.Value).Returns(mqttConfig);

            var mqttClientService = new MqttClientService(mockOptions.Object, mockLogger.Object, null);

            // Act
            await mqttClientService.PublishAsync("test/topic", "test message");

            // Assert
            mockLogger.Verify(
                x => x.Log(
                    LogLevel.Warning,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((o, t) => string.Equals("MQTT client not started, cannot publish to topic test/topic", o.ToString(), StringComparison.OrdinalIgnoreCase)),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }
    }
}

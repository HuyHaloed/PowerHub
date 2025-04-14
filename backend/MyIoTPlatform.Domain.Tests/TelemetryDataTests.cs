using MyIoTPlatform.Domain.Entities;
using NUnit.Framework;
using System;

namespace MyIoTPlatform.Domain.Tests
{
    public class TelemetryDataTests
    {
        [Test]
        public void CreateTelemetryData_ValidData_Success()
        {
            // Arrange
            var telemetry = new TelemetryData
            {
                Id = Guid.NewGuid(),
                DeviceId = Guid.NewGuid(),
                Key = "temperature",
                Value = "25.5",
                Timestamp = DateTime.UtcNow
            };

            // Act & Assert
            Assert.IsNotNull(telemetry);
            Assert.AreEqual("temperature", telemetry.Key);
            Assert.AreEqual("25.5", telemetry.Value);
        }
    }
}
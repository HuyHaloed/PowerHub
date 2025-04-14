using MyIoTPlatform.Domain.Entities;
using MyIoTPlatform.Domain.Enums;
using NUnit.Framework;
using System;

namespace MyIoTPlatform.Domain.Tests
{
    public class AlarmTests
    {
        [Test]
        public void CreateAlarm_ValidData_Success()
        {
            // Arrange
            var alarm = new Alarm
            {
                AlarmId = Guid.NewGuid(),
                DeviceId = Guid.NewGuid(),
                Type = "Overheat",
                Severity = AlarmSeverity.Critical,
                Status = "Active",
                CreatedTime = DateTime.UtcNow
            };

            // Act & Assert
            Assert.IsNotNull(alarm);
            Assert.AreEqual("Overheat", alarm.Type);
            Assert.AreEqual(AlarmSeverity.Critical, alarm.Severity);
        }
    }
}
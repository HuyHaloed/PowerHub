using MyIoTPlatform.Domain.Entities;
using NUnit.Framework;
using System;

namespace MyIoTPlatform.Domain.Tests
{
    public class DeviceTests
    {
        [Test]
        public void CreateDevice_ValidData_Success()
        {
            // Arrange
            var device = new Device
            {
                Id = Guid.NewGuid(),
                Name = "Test Device",
                DeviceTypeId = Guid.NewGuid(),
                Status = Enums.DeviceStatus.Active
            };

            // Act & Assert
            Assert.IsNotNull(device);
            Assert.AreEqual("Test Device", device.Name);
        }
    }
}

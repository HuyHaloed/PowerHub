using Microsoft.AspNetCore.Mvc;
using Moq;
using MyIoTPlatform.API.Controllers;
using MyIoTPlatform.Application.Features.Devices.Commands;
using MediatR;
using NUnit.Framework;
using System;
using System.Threading.Tasks;
using System.Threading;

namespace MyIoTPlatform.API.Tests
{
    public class DevicesControllerTests
    {
        [Test]
        public async Task RegisterDevice_ValidInput_ReturnsOkResult()
        {
            // Arrange
            var mockMediator = new Mock<IMediator>();
            mockMediator.Setup(m => m.Send(It.IsAny<RegisterDeviceCommand>(), It.IsAny<CancellationToken>()))
                        .ReturnsAsync(Guid.NewGuid()); // Simulate successful device registration

            var controller = new DevicesController(mockMediator.Object);
            var command = new RegisterDeviceCommand { Name = "Test Device", DeviceTypeId = Guid.NewGuid() };

            // Act
            var result = await controller.RegisterDevice(command) as OkObjectResult;

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(200, result.StatusCode);
            Assert.IsInstanceOf<Guid>(result.Value);
        }
    }
}

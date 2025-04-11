using MyIoTPlatform.Application.Features.Devices.Commands;
using MyIoTPlatform.Domain.Interfaces.Repositories;
using Moq;
using NUnit.Framework;
using System.Threading;
using System.Threading.Tasks;
using MyIoTPlatform.Application.Interfaces.Persistence;
using MyIoTPlatform.Domain.Entities;
using System;

namespace MyIoTPlatform.Application.Tests
{
    public class RegisterDeviceCommandHandlerTests
    {
        [Test]
        public async Task Handle_ValidCommand_CreatesDevice()
        {
            // Arrange
            var mockDeviceRepository = new Mock<IDeviceRepository>();
            var mockDbContext = new Mock<IApplicationDbContext>();

            var handler = new RegisterDeviceCommandHandler(mockDeviceRepository.Object, mockDbContext.Object);
            var command = new RegisterDeviceCommand { Name = "New Device", DeviceTypeId = Guid.NewGuid() };

            // Act
            await handler.Handle(command, CancellationToken.None);

            // Assert
            mockDeviceRepository.Verify(repo => repo.AddAsync(It.IsAny<Device>()), Times.Once);
            mockDbContext.Verify(context => context.SaveChangesAsync(CancellationToken.None), Times.Once);
        }
    }
}

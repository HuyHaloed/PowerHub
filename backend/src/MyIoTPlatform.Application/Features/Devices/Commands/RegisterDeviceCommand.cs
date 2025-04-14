using MediatR;
using MyIoTPlatform.Application.Features.Devices.DTOs;

namespace MyIoTPlatform.Application.Features.Devices.Commands
{
    public class RegisterDeviceCommand : IRequest<DeviceDto>
    {
        public required string DeviceName { get; set; }
        public required string DeviceType { get; set; }
        public required string Description { get; set; }
    }
}
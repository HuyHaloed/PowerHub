using MediatR;
using MyIoTPlatform.Application.Features.Devices.DTOs;
using System;

namespace MyIoTPlatform.Application.Features.Devices.Queries
{
    public class GetDeviceByIdQuery : IRequest<DeviceDto>
    {
        public Guid Id { get; set; } // Retained only the necessary property
    }
}
using System;

namespace MyIoTPlatform.Application.Features.Devices.DTOs
{
    public class DeviceDto
    {
        public required string Id { get; set; }
        public required string Name { get; set; }
        public required string Type { get; set; }
        public required string Description { get; set; }
    }
}
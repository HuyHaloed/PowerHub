using System;

namespace MyIoTPlatform.Application.Features.Devices.DTOs
{
    public class DeviceDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string DeviceId { get; set; } = string.Empty;
        public string DeviceType { get; set; } = string.Empty;
        public string? Label { get; set; }
        public string? Description { get; set; }
        public bool Enabled { get; set; }
        public DateTime CreatedTime { get; set; }
        public DateTime? UpdatedTime { get; set; }

    }
}
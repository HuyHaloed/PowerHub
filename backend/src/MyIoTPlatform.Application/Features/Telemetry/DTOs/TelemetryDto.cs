using System;

namespace MyIoTPlatform.Application.Features.Telemetry.DTOs
{
    public class TelemetryDto
    {
        public Guid DeviceId { get; set; }
        public required string Key { get; set; } // Added required modifier
        public required string Value { get; set; } // Added required modifier
        public DateTime Timestamp { get; set; }
    }
}
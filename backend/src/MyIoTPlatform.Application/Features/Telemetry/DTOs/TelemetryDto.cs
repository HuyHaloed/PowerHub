using System;

namespace MyIoTPlatform.Application.Features.Telemetry.DTOs
{
    public class TelemetryDto
    {
        public Guid Id {get; set;}
        public Guid DeviceId { get; set; }
        public DateTime Timestamp { get; set; }
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        // public decimal? DoubleValue { get; set; }
        // public long? LongValue { get; set; }
        // public string? StringValue { get; set; }
        // public bool? BooleanValue { get; set; }
    }
}
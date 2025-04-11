namespace MyIoTPlatform.Domain.Entities;

public class TelemetryData
{
    public Guid Id {get; set;}
    public Guid DeviceId { get; set; }
    public DateTime Timestamp { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public Device? Device { get; set; }
    // public decimal? DoubleValue { get; set; }
    // public long? LongValue { get; set; }
    // public string StringValue { get; set; }
    // public bool? BooleanValue { get; set; }
}
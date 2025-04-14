namespace MyIoTPlatform.Domain.Entities;

public class TelemetryData
{
    public Guid Id {get; set;}
    public Guid DeviceId { get; set; }
    public DateTime Timestamp { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string DataType { get; set; } = string.Empty; // Data type of the telemetry (e.g., temperature, humidity)
    public required string ValueJson { get; set; } // Added required modifier
    public Device? Device { get; set; }

    /// <summary>
    /// Validates the telemetry data entity to ensure all required fields are set.
    /// </summary>
    /// <exception cref="InvalidOperationException">Thrown if validation fails.</exception>
    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(Key))
            throw new InvalidOperationException("Telemetry key is required.");

        if (string.IsNullOrWhiteSpace(Value))
            throw new InvalidOperationException("Telemetry value is required.");
    }
}
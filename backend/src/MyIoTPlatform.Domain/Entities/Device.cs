namespace MyIoTPlatform.Domain.Entities;

public class Device
{
    public string Label { get; set; } = string.Empty;
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // Ví dụ: "Sensor", "Actuator"
    public string Description { get; set; } = string.Empty;
    public bool Enabled { get; set; }
    public string Status { get; set; } = "Inactive"; // Ví dụ: "Active", "Inactive", "Error"
    public DateTime CreatedAt { get; set; }
    public DateTime? LastActivityAt { get; set; }
    public DateTime? UpdateAt {get; set;}
    public ICollection<TelemetryData> Telemetries { get; set; } = new List<TelemetryData>();
    public string AccessToken { get; set; } = string.Empty; // Token for ThingsBoard authentication
    public string DeviceProfile { get; set; } = string.Empty; // Profile for categorizing devices
    public string DeviceType { get; set; } = string.Empty; // e.g., "ThermalSensor", "Lamp", "Fan", "YolounoCircuit"
    public string Configuration { get; set; } = string.Empty; // JSON or string for device-specific settings
    public string? Location { get; set; } // Added Location property
    public required string PropertiesJson { get; set; } // Added required modifier
    
    public Device()
    {
        CreatedAt = DateTime.UtcNow;
        Status = "Inactive";
    }
    public Device(string label, string name, string type, string description, bool enabled, string status)
    {
        Label = label;
        Name = name;
        Type = type;
        Description = description;
        Enabled = enabled;
        Status = status;
        CreatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Validates the device entity to ensure all required fields are set.
    /// </summary>
    /// <exception cref="InvalidOperationException">Thrown if validation fails.</exception>
    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(Name))
            throw new InvalidOperationException("Device name is required.");

        if (string.IsNullOrWhiteSpace(DeviceType))
            throw new InvalidOperationException("Device type is required.");
    }
}
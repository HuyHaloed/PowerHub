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
}
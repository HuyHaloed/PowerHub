namespace MyIoTPlatform.Domain.Entities;

public class Device
{
    public Guid DeviceId { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // Ví dụ: "Sensor", "Actuator"
    public string Description { get; set; } =string.Empty;
    public bool Enabled { get; set; }
    public string Status { get; set; } = "Inactive"; // Ví dụ: "Active", "Inactive", "Error"
    public DateTime CreatedAt { get; set; }
    public DateTime? LastActivityAt { get; set; }
    // Thêm các thuộc tính khác nếu cần
}
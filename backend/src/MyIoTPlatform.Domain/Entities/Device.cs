// Ví dụ: Device.cs
namespace MyIoTPlatform.Domain.Entities;

public class Device
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // Ví dụ: "Sensor", "Actuator"
    public string Status { get; set; } = "Inactive"; // Ví dụ: "Active", "Inactive", "Error"
    public DateTime CreatedAt { get; set; }
    public DateTime? LastActivityAt { get; set; }
    // Thêm các thuộc tính khác nếu cần
}
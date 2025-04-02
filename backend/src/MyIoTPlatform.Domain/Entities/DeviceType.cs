namespace MyIoTPlatform.Domain.Entities;

public class DeviceType
{
    public string Name { get; set; } = string.Empty; // Tên của loại thiết bị (ví dụ: Temperature Sensor, Light Controller)
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedTime { get; set; }
    public DateTime? UpdatedTime { get; set; }
}
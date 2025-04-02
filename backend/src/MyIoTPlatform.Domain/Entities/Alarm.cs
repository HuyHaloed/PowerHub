namespace MyIoTPlatform.Domain.Entities;

public class Alarm
{
    public Guid DeviceId {get; set;}
    public string Type {get; set;} = string.Empty;
    public string Severity {get; set;} = "Info";    // Mức độ nghiêm trọng của cảnh báo (ví dụ: Info, Warning, Critical)
    public string Status { get; set; } = "Inactive"; // Trạng thái của cảnh báo (ví dụ: Active, Cleared, Acknowledged)
    public DateTime CreatedTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string Details { get; set; } = string.Empty;
}
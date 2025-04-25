namespace MyIoTPlatform.Infrastructure.Communication.CoreIot.Models
{
    public class CoreIotTelemetryData
    {
        public required string DeviceId { get; set; }
        public string Name { get; set; }
        public DateTime Timestamp { get; set; }
        public Dictionary<string, object> Values { get; set; }
        public string Status { get; set; }
    }

    public class CoreIotDeviceData
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }
        public string Status { get; set; }
        public string Label { get; set; }
        public DateTime CreatedTime { get; set; }
        public Dictionary<string, object> Attributes { get; set; }
    }
}
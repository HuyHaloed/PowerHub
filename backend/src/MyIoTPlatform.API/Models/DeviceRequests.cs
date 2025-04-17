namespace MyIoTPlatform.API.Models
{
    public class ControlDeviceRequest
    {
        public string Status { get; set; } = string.Empty;
    }
    public class AddDeviceRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public DeviceProperties? Properties { get; set; }
    }

    public class UpdateDeviceRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public DeviceProperties? Properties { get; set; }
    }
}
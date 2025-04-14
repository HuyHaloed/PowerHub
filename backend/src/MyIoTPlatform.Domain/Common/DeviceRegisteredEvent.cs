using System;

namespace MyIoTPlatform.Domain.Common
{
    /// <summary>
    /// Event triggered when a new device is registered.
    /// </summary>
    public class DeviceRegisteredEvent
    {
        public Guid DeviceId { get; set; }
        public string DeviceName { get; set; } = string.Empty;
        public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;

        public DeviceRegisteredEvent(Guid deviceId, string deviceName)
        {
            DeviceId = deviceId;
            DeviceName = deviceName;
        }
    }
}
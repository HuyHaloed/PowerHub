using System;

namespace MyIoTPlatform.Domain.Exceptions
{
    public class TelemetryKeyNotFoundException : DomainException
    {
        public TelemetryKeyNotFoundException(Guid deviceId, string key)
            : base($"Telemetry key '{key}' not found for device with ID '{deviceId}'.")
        {
        }

        public TelemetryKeyNotFoundException(string deviceId, string key)
            : base($"Telemetry key '{key}' not found for device with DeviceId '{deviceId}'.")
        {
        }
    }
}
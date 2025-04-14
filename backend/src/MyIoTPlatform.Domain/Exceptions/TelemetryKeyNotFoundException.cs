using MyIoTPlatform.Domain.Common;
namespace MyIoTPlatform.Domain.Exceptions
{
    /// <summary>
    /// Exception thrown when a telemetry key is not found for a specific device.
    /// </summary>
    /// <param name="deviceId">The unique identifier of the device.</param>
    /// <param name="key">The telemetry key that was not found.</param>
    /// <example>
    /// throw new TelemetryKeyNotFoundException(deviceId, "temperature");
    /// </example>
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
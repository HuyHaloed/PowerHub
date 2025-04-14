using MyIoTPlatform.Domain.Common;
namespace MyIoTPlatform.Domain.Exceptions
{
    /// <summary>
    /// Exception thrown when an unauthorized operation is attempted on a device.
    /// </summary>
    /// <param name="deviceId">The unique identifier of the device.</param>
    /// <param name="operation">The operation that was attempted.</param>
    /// <example>
    /// throw new UnauthorizedDeviceOperationException(deviceId, "delete");
    /// </example>
    public class UnauthorizedDeviceOperationException : DomainException
    {
        public UnauthorizedDeviceOperationException(Guid deviceId, string operation)
            : base($"Operation '{operation}' is not authorized for device with ID '{deviceId}'.")
        {
        }

        public UnauthorizedDeviceOperationException(string deviceId, string operation)
            : base($"Operation '{operation}' is not authorized for device with DeviceId '{deviceId}'.")
        {
        }
    }
}
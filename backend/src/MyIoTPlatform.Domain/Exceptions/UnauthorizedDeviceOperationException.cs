using System;

namespace MyIoTPlatform.Domain.Exceptions
{
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
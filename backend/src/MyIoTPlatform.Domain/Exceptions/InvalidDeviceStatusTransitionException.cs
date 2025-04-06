using System;
using MyIoTPlatform.Domain.Enums;

namespace MyIoTPlatform.Domain.Exceptions
{
    public class InvalidDeviceStatusTransitionException : DomainException
    {
        public InvalidDeviceStatusTransitionException(Guid deviceId, DeviceStatus fromStatus, DeviceStatus toStatus)
            : base($"Invalid device status transition for device with ID '{deviceId}' from '{fromStatus}' to '{toStatus}'.")
        {
        }

        public InvalidDeviceStatusTransitionException(string deviceId, DeviceStatus fromStatus, DeviceStatus toStatus)
            : base($"Invalid device status transition for device with DeviceId '{deviceId}' from '{fromStatus}' to '{toStatus}'.")
        {
        }
    }
}
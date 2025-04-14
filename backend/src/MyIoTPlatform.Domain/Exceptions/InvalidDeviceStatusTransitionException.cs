using System;
using MyIoTPlatform.Domain.Enums;
using MyIoTPlatform.Domain.Common;

namespace MyIoTPlatform.Domain.Exceptions
{
    /// <summary>
    /// Exception thrown when an invalid device status transition is attempted.
    /// </summary>
    /// <param name="deviceId">The unique identifier of the device.</param>
    /// <param name="fromStatus">The current status of the device.</param>
    /// <param name="toStatus">The attempted new status of the device.</param>
    /// <example>
    /// throw new InvalidDeviceStatusTransitionException(deviceId, DeviceStatus.Offline, DeviceStatus.Active);
    /// </example>
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
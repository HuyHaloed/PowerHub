namespace MyIoTPlatform.Domain.Enums;

/// <summary>
/// Represents the operational status of a device.
/// </summary>
public enum DeviceStatus
{
    Offline,    // Device is not connected
    Online,     // Device is connected
    Active,     // Device is actively functioning
    Inactive,   // Device is not functioning
    Error,      // Device has encountered an error
    Updating    // Device is being updated
}
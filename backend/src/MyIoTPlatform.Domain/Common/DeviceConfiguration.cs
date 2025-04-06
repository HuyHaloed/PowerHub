namespace MyIoTPlatform.Domain.Common
{
    public class DeviceConfiguration : IEquatable<DeviceConfiguration>
    {
        public string FirmwareVersion { get; }
        public string HardwareVersion { get; }
        // Các thuộc tính cấu hình khác

        public DeviceConfiguration(string firmwareVersion, string hardwareVersion)
        {
            FirmwareVersion = firmwareVersion;
            HardwareVersion = hardwareVersion;
        }

        // Implement Equals, GetHashCode, ==, != tương tự như các Value Object khác
        // ...
        public override bool Equals(object? obj)
        {
            return obj is DeviceConfiguration other && Equals(other);
        }

        public bool Equals(DeviceConfiguration? other)
        {
            if (ReferenceEquals(null, other)) return false;
            if (ReferenceEquals(this, other)) return true;
            return FirmwareVersion == other.FirmwareVersion && HardwareVersion == other.HardwareVersion;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(FirmwareVersion, HardwareVersion);
        }

        public static bool operator ==(DeviceConfiguration left, DeviceConfiguration right)
        {
            return Equals(left, right);
        }

        public static bool operator !=(DeviceConfiguration left, DeviceConfiguration right)
        {
            return !Equals(left, right);
        }
    }
}
namespace MyIoTPlatform.Domain.Common
{
    public class TelemetryValue : IEquatable<TelemetryValue>
    {
        public decimal Value { get; }
        public string? Unit { get; } // Đơn vị đo (ví dụ: °C, %, ppm)

        public TelemetryValue(decimal value, string? unit = null)
        {
            Value = value;
            Unit = unit;
        }

        public override bool Equals(object? obj)
        {
            return obj is TelemetryValue other && Equals(other);
        }

        public bool Equals(TelemetryValue? other)
        {
            if (ReferenceEquals(null, other)) return false;
            if (ReferenceEquals(this, other)) return true;
            return Value == other.Value && Unit == other.Unit;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(Value, Unit);
        }

        public static bool operator ==(TelemetryValue left, TelemetryValue right)
        {
            return Equals(left, right);
        }

        public static bool operator !=(TelemetryValue left, TelemetryValue right)
        {
            return !Equals(left, right);
        }
    }
}
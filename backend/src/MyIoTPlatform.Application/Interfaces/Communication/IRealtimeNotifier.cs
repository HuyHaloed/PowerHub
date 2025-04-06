using System;
using System.Threading.Tasks;

namespace MyIoTPlatform.Application.Interfaces.Communication;

public interface IRealtimeNotifier
{
    Task NotifyTelemetryUpdateAsync(Guid deviceId, string key, string value, DateTime timestamp);
    // Bạn có thể thêm các phương thức khác nếu cần
}
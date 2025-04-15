using MyIoTPlatform.Application.Features.Telemetry.DTOs;
namespace MyIoTPlatform.Application.Interfaces.Communication
{
    public interface IRealtimeNotifier
    {
        Task NotifyAllAsync(string eventName, object payload);
        Task NotifyUserAsync(string userId, string eventName, object payload);
        Task NotifyTelemetryUpdateAsync(TelemetryDto payload);
    }
}

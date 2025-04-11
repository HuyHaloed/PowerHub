using MyIoTPlatform.Domain.Entities;

namespace MyIoTPlatform.Application.Interfaces.Repositories
{
    public interface ITelemetryRepository
    {
        Task<List<TelemetryData>> GetByDeviceIdAsync(Guid deviceId);
        Task AddAsync(TelemetryData telemetry);
    }
}

using MyIoTPlatform.Domain.Entities;

namespace MyIoTPlatform.Domain.Interfaces.Repositories;

public interface ITelemetryRepository
{
    Task<TelemetryData?> GetLatestByKeyAsync(Guid deviceId, string key, CancellationToken cancellationToken = default);
    Task<IEnumerable<TelemetryData>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<TelemetryData>> GetLatestAsync(TelemetryData telemetry, CancellationToken cancellationToken = default);
    Task<IEnumerable<TelemetryData>> AddAsync(TelemetryData telemetry, CancellationToken cancellationToken = default);
    Task GetHistoryAsync(TelemetryData device, string key, CancellationToken cancellationToken = default);
}
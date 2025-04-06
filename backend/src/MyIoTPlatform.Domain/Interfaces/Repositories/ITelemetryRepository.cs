using MyIoTPlatform.Domain.Entities;

namespace MyIoTPlatform.Domain.Interfaces.Repositories;

public interface ITelemetryRepository
{
    Task<TelemetryData?> GetLatestByKeyAsync(Guid deviceId, string key, CancellationToken cancellationToken = default);
    Task<IEnumerable<TelemetryData>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAsync(TelemetryData telemetry, CancellationToken cancellationToken = default);
    Task UpdateAsync(TelemetryData telemetry, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default); // Có thể cần hoặc không
    Task<IEnumerable<TelemetryData>> GetLatestAsync(Guid deviceId, int limit = 10, CancellationToken cancellationToken = default);
    Task<IEnumerable<TelemetryData>> GetHistoryAsync(Guid deviceId, string key, DateTime startTime, DateTime endTime, CancellationToken cancellationToken = default);
    Task<Dictionary<string, TelemetryData>?> GetLatestTelemetryByDeviceIdAsync(Guid deviceId, CancellationToken cancellationToken);
}
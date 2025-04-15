using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MyIoTPlatform.Domain.Entities;
using MyIoTPlatform.Domain.Interfaces.Repositories;

namespace MyIoTPlatform.Infrastructure.Persistence {
    public class TelemetryRepository : ITelemetryRepository {
        public Task<TelemetryData?> GetLatestByKeyAsync(Guid deviceId, string key, CancellationToken cancellationToken = default)
            => Task.FromResult<TelemetryData?>(null);

        public Task<IEnumerable<TelemetryData>> GetAllAsync(Guid deviceId, CancellationToken cancellationToken)
            => Task.FromResult<IEnumerable<TelemetryData>>(new List<TelemetryData>());

        public Task AddAsync(TelemetryData telemetry, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task UpdateAsync(TelemetryData telemetry, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<IEnumerable<TelemetryData>> GetLatestAsync(Guid deviceId, int limit = 10, CancellationToken cancellationToken = default)
            => Task.FromResult<IEnumerable<TelemetryData>>(new List<TelemetryData>());

        public Task<IEnumerable<TelemetryData>> GetHistoryAsync(Guid deviceId, string key, DateTime startTime, DateTime endTime, CancellationToken cancellationToken = default)
            => Task.FromResult<IEnumerable<TelemetryData>>(new List<TelemetryData>());

        public Task<Dictionary<string, TelemetryData>?> GetLatestTelemetryByDeviceIdAsync(Guid deviceId, CancellationToken cancellationToken)
            => Task.FromResult<Dictionary<string, TelemetryData>?>(null);

        public Task<IEnumerable<TelemetryData>> GetByDataTypeAsync(string dataType, CancellationToken cancellationToken = default)
            => Task.FromResult<IEnumerable<TelemetryData>>(new List<TelemetryData>());
    }
}
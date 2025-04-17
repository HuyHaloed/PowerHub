using MyIoTPlatform.Application.Interfaces.Repositories;
using MyIoTPlatform.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using MyIoTPlatform.Infrastructure.Persistence.DbContexts;

namespace MyIoTPlatform.Infrastructure.Persistence.Repositories
{
    public class TelemetryRepository : ITelemetryRepository
    {
        public ApplicationDbContext _dbContext;

        public TelemetryRepository(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<TelemetryData>> GetByDeviceIdAsync(Guid deviceId) =>
            await _dbContext.Telemetries
                .Where(t => t.DeviceId == deviceId)
                .OrderByDescending(t => t.Timestamp)
                .ToListAsync();

        public async Task AddAsync(TelemetryData telemetry)
        {
            await _dbContext.Telemetries.AddAsync(telemetry);
            await _dbContext.SaveChangesAsync();
        }

        public async Task<TelemetryData?> GetLatestByKeyAsync(Guid deviceId, string key, CancellationToken cancellationToken = default)
        {
            return await _dbContext.Telemetries
                .Where(t => t.DeviceId == deviceId && t.Key == key)
                .OrderByDescending(t => t.Timestamp)
                .FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<IEnumerable<TelemetryData>> GetAllAsync(Guid deviceId, CancellationToken cancellationToken)
        {
            return await _dbContext.Telemetries
                .Where(t => t.DeviceId == deviceId)
                .ToListAsync(cancellationToken);
        }

        public async Task AddAsync(TelemetryData telemetry, CancellationToken cancellationToken = default)
        {
            await _dbContext.Telemetries.AddAsync(telemetry, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        public async Task UpdateAsync(TelemetryData telemetry, CancellationToken cancellationToken = default)
        {
            _dbContext.Telemetries.Update(telemetry);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var telemetryToDelete = await _dbContext.Telemetries.FindAsync(new object[] { id }, cancellationToken);
            if (telemetryToDelete != null)
            {
                _dbContext.Telemetries.Remove(telemetryToDelete);
                await _dbContext.SaveChangesAsync(cancellationToken);
            }
        }

        public async Task<IEnumerable<TelemetryData>> GetLatestAsync(Guid deviceId, int limit = 10, CancellationToken cancellationToken = default)
        {
            return await _dbContext.Telemetries
                .Where(t => t.DeviceId == deviceId)
                .OrderByDescending(t => t.Timestamp)
                .Take(limit)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<TelemetryData>> GetHistoryAsync(Guid deviceId, string key, DateTime startTime, DateTime endTime, CancellationToken cancellationToken = default)
        {
            return await _dbContext.Telemetries
                .Where(t => t.DeviceId == deviceId && t.Key == key && t.Timestamp >= startTime && t.Timestamp <= endTime)
                .OrderBy(t => t.Timestamp)
                .ToListAsync(cancellationToken);
        }

        public async Task<Dictionary<string, TelemetryData>?> GetLatestTelemetryByDeviceIdAsync(Guid deviceId, CancellationToken cancellationToken)
        {
            return await _dbContext.Telemetries
                .Where(t => t.DeviceId == deviceId)
                .GroupBy(t => t.Key)
                .Select(g => g.OrderByDescending(t => t.Timestamp).FirstOrDefault())
                .Where(t => t != null)
                .ToDictionaryAsync(t => t!.Key, t => t!, cancellationToken);
        }

        public async Task<IEnumerable<TelemetryData>> GetByDataTypeAsync(string dataType, CancellationToken cancellationToken = default)
        {
            return await _dbContext.Telemetries
                .Where(t => t.DataType == dataType)
                .ToListAsync(cancellationToken);
        }
    }
}
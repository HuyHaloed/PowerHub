using MyIoTPlatform.Application.Interfaces.Repositories;
using MyIoTPlatform.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using MyIoTPlatform.Infrastructure.Persistence.DbContexts;

namespace MyIoTPlatform.Infrastructure.Persistence.Repositories
{
    public class TelemetryRepository : ITelemetryRepository
    {
        private readonly ApplicationDbContext _dbContext;

        public TelemetryRepository(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<TelemetryData>> GetByDeviceIdAsync(Guid deviceId) =>
            await _dbContext.TelemetryData
                .Where(t => t.DeviceId == deviceId)
                .OrderByDescending(t => t.Timestamp)
                .ToListAsync();

        public async Task AddAsync(TelemetryData telemetry)
        {
            await AddAsync(telemetry, default);
        }

        public async Task AddAsync(TelemetryData telemetry, CancellationToken cancellationToken = default)
        {
            await _dbContext.TelemetryData.AddAsync(telemetry, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}

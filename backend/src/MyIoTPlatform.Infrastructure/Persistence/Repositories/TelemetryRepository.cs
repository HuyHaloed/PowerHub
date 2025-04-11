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
            await _dbContext.Telemetries
                .Where(t => t.DeviceId == deviceId)
                .OrderByDescending(t => t.Timestamp)
                .ToListAsync();

        public async Task AddAsync(TelemetryData telemetry)
        {
            await _dbContext.Telemetries.AddAsync(telemetry);
            await _dbContext.SaveChangesAsync();
        }
    }
}

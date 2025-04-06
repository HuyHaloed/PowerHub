using MyIoTPlatform.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MyIoTPlatform.Application.Interfaces.Persistence
{
    public interface IApplicationDbContext
    {
        DbSet<Device> Devices { get; }
        DbSet<TelemetryData> TelemetryDatas { get; }
        
        Task<int> SaveChangesAsync(CancellationToken cancellationToken);
    }
}
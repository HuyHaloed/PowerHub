// MyIoTPlatform.Infrastructure/Persistence/UnitOfWork.cs
using MyIoTPlatform.Domain.Interfaces.Repositories;
using MyIoTPlatform.Infrastructure.Persistence.DbContexts;
using System.Threading;
using System.Threading.Tasks;

namespace MyIoTPlatform.Infrastructure.Persistence
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ApplicationDbContext _dbContext;

        public UnitOfWork(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return await _dbContext.SaveChangesAsync(cancellationToken);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _dbContext.SaveChangesAsync();
        }
    }
}
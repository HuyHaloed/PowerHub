using MyIoTPlatform.Domain.Interfaces.Repositories;
using MyIoTPlatform.Infrastructure.Persistence.DbContexts;

namespace MyIoTPlatform.Infrastructure.Persistence
{
    public class UnitOfWork : IUnitOfWork
    {
        // Inject DbContext
        private readonly ApplicationDbContext _context;

        public UnitOfWork(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return await _context.SaveChangesAsync(cancellationToken);
        }

    }
}

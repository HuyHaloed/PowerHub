using MyIoTPlatform.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyIoTPlatform.Domain.Interfaces.Repositories
{
    public interface IDashboardRepository
    {
        Task AddAsync(Dashboard dashboard);
        Task<IEnumerable<Dashboard>> GetAllAsync();
    }
}
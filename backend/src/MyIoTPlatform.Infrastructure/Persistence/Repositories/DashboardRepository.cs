using MyIoTPlatform.Domain.Entities;
using MyIoTPlatform.Domain.Interfaces.Repositories;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyIoTPlatform.Infrastructure.Persistence.Repositories
{
    public class DashboardRepository : IDashboardRepository
    {
        private readonly List<Dashboard> _dashboards = new();

        public Task AddAsync(Dashboard dashboard)
        {
            _dashboards.Add(dashboard);
            return Task.CompletedTask;
        }

        public Task<IEnumerable<Dashboard>> GetAllAsync()
        {
            return Task.FromResult<IEnumerable<Dashboard>>(_dashboards);
        }
    }
}
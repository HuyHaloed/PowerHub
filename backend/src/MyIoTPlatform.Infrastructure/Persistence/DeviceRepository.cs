using MyIoTPlatform.Domain.Interfaces.Repositories;
using MyIoTPlatform.Domain.Entities;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using System;
using System.Linq.Expressions;

namespace MyIoTPlatform.Infrastructure.Persistence {
    public class DeviceRepository : IDeviceRepository {
        public Task<Device?> GetByIdAsync(Guid DeviceId, CancellationToken cancellationToken = default)
            => Task.FromResult<Device?>(null);

        public Task<IEnumerable<Device>> GetAllAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<IEnumerable<Device>>(new List<Device>());

        public Task AddAsync(Device device, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task UpdateAsync(Device device, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
            => Task.FromResult(false);

        public Task<IEnumerable<Device>> GetByTypeAsync(string type, CancellationToken cancellationToken = default)
            => Task.FromResult<IEnumerable<Device>>(new List<Device>());

        public Task<IEnumerable<Device>> GetByStatusAsync(string status, CancellationToken cancellationToken = default)
            => Task.FromResult<IEnumerable<Device>>(new List<Device>());

        public Task<Device?> GetByAccessTokenAsync(string accessToken, CancellationToken cancellationToken = default)
            => Task.FromResult<Device?>(null);

        public Task<IEnumerable<Device>> GetFilteredAsync(System.Linq.Expressions.Expression<System.Func<Device, bool>>? filter = null, CancellationToken cancellationToken = default)
            => Task.FromResult<IEnumerable<Device>>(new List<Device>());
    }
}
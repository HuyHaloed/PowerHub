// Ví dụ: IDeviceRepository.cs
using MyIoTPlatform.Domain.Entities;

namespace MyIoTPlatform.Domain.Interfaces.Repositories;

public interface IDeviceRepository
{
    Task<Device?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Device>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAsync(Device device, CancellationToken cancellationToken = default);
    Task UpdateAsync(Device device, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
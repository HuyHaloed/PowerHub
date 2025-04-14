using MyIoTPlatform.Domain.Entities;
using System.Linq.Expressions;

namespace MyIoTPlatform.Domain.Interfaces.Repositories;

public interface IDeviceRepository
{
    Task<Device?> GetByIdAsync(Guid DeviceId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Device>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAsync(Device device, CancellationToken cancellationToken = default);
    Task UpdateAsync(Device device, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Device>> GetByTypeAsync(string type, CancellationToken cancellationToken = default);
    Task<IEnumerable<Device>> GetByStatusAsync(string status, CancellationToken cancellationToken = default);
    Task<Device?> GetByAccessTokenAsync(string accessToken, CancellationToken cancellationToken = default);
    Task<IEnumerable<Device>> GetFilteredAsync(
        Expression<Func<Device, bool>>? filter = null, // Điều kiện lọc (LINQ expression)
        // Func<IQueryable<Device>, IOrderedQueryable<Device>>? orderBy = null, // Sắp xếp
        // int? skip = null, // Bỏ qua bao nhiêu bản ghi (phân trang)
        // int? take = null, // Lấy bao nhiêu bản ghi (phân trang)
        CancellationToken cancellationToken = default);
}
using Microsoft.EntityFrameworkCore; // Cần cho ToListAsync, FindAsync...
using MyIoTPlatform.Application.Interfaces.Persistence; // IApplicationDbContext
using MyIoTPlatform.Domain.Entities;
using MyIoTPlatform.Domain.Interfaces.Repositories; // IDeviceRepository

namespace MyIoTPlatform.Infrastructure.Persistence.Repositories;

public class DeviceRepository : IDeviceRepository
{
    private readonly IApplicationDbContext _context; // Dùng Interface thay vì class cụ thể

    public DeviceRepository(IApplicationDbContext context)
    {
        _context = context;
        // Lưu ý: Không gọi SaveChangesAsync() ở đây!
    }

    public async Task<Device?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // FindAsync tối ưu cho tìm theo khóa chính
        return await _context.Devices.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<IEnumerable<Device>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Devices.AsNoTracking().ToListAsync(cancellationToken); // AsNoTracking nếu chỉ đọc
    }

    public async Task AddAsync(Device device, CancellationToken cancellationToken = default)
    {
        await _context.Devices.AddAsync(device, cancellationToken);
        // KHÔNG gọi SaveChangesAsync ở đây
    }

    public Task UpdateAsync(Device device, CancellationToken cancellationToken = default)
    {
        // EF Core tự động theo dõi thay đổi nếu device được lấy ra từ cùng DbContext instance
        // Chỉ cần đánh dấu là Modified nếu device không được track hoặc attach từ bên ngoài
         _context.Devices.Update(device); // Hoặc _context.Entry(device).State = EntityState.Modified;
         // KHÔNG gọi SaveChangesAsync ở đây
         return Task.CompletedTask; // Update thường là đồng bộ khi chỉ thay đổi state
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var device = await GetByIdAsync(id, cancellationToken);
        if (device != null)
        {
            _context.Devices.Remove(device);
            // KHÔNG gọi SaveChangesAsync ở đây
        }
        // Có thể throw lỗi nếu không tìm thấy hoặc chỉ return
    }
}
// Lưu ý: SaveChangesAsync thường được gọi ở cuối Command Handler trong lớp Application
// để đảm bảo tất cả thay đổi trong một "use case" được lưu như một transaction.
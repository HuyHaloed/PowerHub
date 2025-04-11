using Microsoft.EntityFrameworkCore;
using MyIoTPlatform.Application.Interfaces.Persistence; // Interface từ Application
using MyIoTPlatform.Domain.Entities; // Entities từ Domain
using System.Reflection; // Cần cho ApplyConfigurationsFromAssembly

namespace MyIoTPlatform.Infrastructure.Persistence.DbContexts;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // Khai báo các bảng sẽ được tạo trong DB
    public DbSet<Device> Devices => Set<Device>(); // Cách viết gọn hơn
    public DbSet<TelemetryData> TelemetryData => Set<TelemetryData>();
    public DbSet<TelemetryData> Telemetries => Set<TelemetryData>();
    // Thêm DbSet cho các entity khác...
    public DbSet<Alarm> Alarms => Set<Alarm>();

    // Triển khai phương thức từ Interface IApplicationDbContext
    // SaveChangesAsync đã có sẵn trong DbContext base class.

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Ví dụ cấu hình Fluent API (nên tách ra các file config riêng nếu phức tạp)
        modelBuilder.Entity<Device>(entity =>
        {
            entity.HasKey(e => e.Id); // Định nghĩa khóa chính
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.Name).IsUnique(); // Ví dụ: Tên thiết bị là duy nhất
        });

        modelBuilder.Entity<TelemetryData>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Timestamp).IsRequired();
            entity.HasIndex(e => new { e.DeviceId, e.Timestamp }); // Index để tăng tốc truy vấn telemetry theo device và thời gian
            // Thiết lập mối quan hệ với Device (nếu chưa dùng attribute)
            entity.HasOne<Device>() // Một Telemetry thuộc về một Device
                  .WithMany() // Một Device có thể có nhiều Telemetry (ko cần navigation prop ở Device)
                  .HasForeignKey(e => e.DeviceId) // Khóa ngoại
                  .OnDelete(DeleteBehavior.Cascade); // Ví dụ: Xóa device thì xóa cả telemetry
        });


        // Cách tốt hơn: Áp dụng tất cả cấu hình từ các file riêng trong Assembly này
        // modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        base.OnModelCreating(modelBuilder);
    }
}
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MyIoTPlatform.Domain.Entities;

namespace MyIoTPlatform.Infrastructure.Persistence.Configuration
{
    public class TelemetryConfiguration : IEntityTypeConfiguration<TelemetryData>
    {
        public void Configure(EntityTypeBuilder<TelemetryData> builder)
        {
            builder.HasKey(t => t.Id);
            builder.Property(t => t.Key).IsRequired();
            builder.Property(t => t.Value).IsRequired();
            builder.HasIndex(t => t.Timestamp);

            builder.HasOne(t => t.Device)
                   .WithMany(d => d.Telemetries)
                   .HasForeignKey(t => t.DeviceId);
        }
    }
}

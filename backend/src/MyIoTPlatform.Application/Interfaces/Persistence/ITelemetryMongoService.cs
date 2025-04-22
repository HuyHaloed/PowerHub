using MyIoTPlatform.Domain.Entities;
using System.Threading.Tasks;

namespace MyIoTPlatform.Application.Interfaces.Persistence
{
    public interface ITelemetryMongoService
    {
        Task InsertTelemetryAsync(MyIoTPlatform.Domain.Entities.TelemetryData telemetry);
    }
}

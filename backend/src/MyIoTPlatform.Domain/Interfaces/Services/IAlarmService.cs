using System;
using System.Threading;
using System.Threading.Tasks;
using MyIoTPlatform.Domain.Entities;
using MyIoTPlatform.Domain.Enums;

namespace MyIoTPlatform.Domain.Interfaces.Services
{
    public interface IAlarmService
    {
        Task RaiseAlarmAsync(Guid deviceId, string type, AlarmSeverity severity, string details, CancellationToken cancellationToken = default);
        Task ClearAlarmAsync(Guid deviceId, string type, CancellationToken cancellationToken = default);
        Task AcknowledgeAlarmAsync(Guid alarmId, CancellationToken cancellationToken = default);
        Task<IEnumerable<Alarm>> GetActiveAlarmsByDeviceAsync(Guid deviceId, CancellationToken cancellationToken = default);
        Task<IEnumerable<Alarm>> GetHistoricalAlarmsByDeviceAsync(Guid deviceId, DateTime startTime, DateTime endTime, CancellationToken cancellationToken = default);
    }
}
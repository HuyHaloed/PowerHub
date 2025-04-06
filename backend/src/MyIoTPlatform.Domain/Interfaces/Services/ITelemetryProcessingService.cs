using MyIoTPlatform.Domain.Entities;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace MyIoTPlatform.Domain.Interfaces.Services;

public interface ITelemetryProcessingService
{
    Task ProcessTelemetryAsync(Guid deviceId, string key, string value, DateTime timestamp, CancellationToken cancellationToken = default);
    Task ValidateTelemetryDataAsync(TelemetryData telemetry, CancellationToken cancellationToken = default);
    Task TransformTelemetryDataAsync(TelemetryData telemetry, CancellationToken cancellationToken = default);
}
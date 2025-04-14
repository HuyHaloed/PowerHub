using System;
using System.Threading;
using System.Threading.Tasks;

namespace MyIoTPlatform.Domain.Interfaces.Services
{
    /// <summary>
    /// Interface for managing thermal sensors.
    /// </summary>
    public interface IThermalSensorService
    {
        Task<double> GetTemperatureAsync(Guid deviceId, CancellationToken cancellationToken = default);
        Task SetTemperatureThresholdAsync(Guid deviceId, double threshold, CancellationToken cancellationToken = default);
    }
}
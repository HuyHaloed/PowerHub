using System;
using System.Threading;
using System.Threading.Tasks;

namespace MyIoTPlatform.Domain.Interfaces.Services
{
    /// <summary>
    /// Interface for managing lamps.
    /// </summary>
    public interface ILampService
    {
        Task TurnOnAsync(Guid deviceId, CancellationToken cancellationToken = default);
        Task TurnOffAsync(Guid deviceId, CancellationToken cancellationToken = default);
        Task SetBrightnessAsync(Guid deviceId, int brightness, CancellationToken cancellationToken = default);
    }
}
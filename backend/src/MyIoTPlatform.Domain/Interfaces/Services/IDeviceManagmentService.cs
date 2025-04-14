using MyIoTPlatform.Domain.Entities;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace MyIoTPlatform.Domain.Interfaces.Services;

public interface IDeviceManagmentService
{
    Task<Device> RegisterDeviceAsync(string name, string deviceId, string deviceType, CancellationToken cancellationToken = default);
    Task<Device> UpdateDeviceAsync(Guid id, string name, string label, bool enabled, CancellationToken cancellationToken = default);
    Task DeleteDeviceAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Device> GetDeviceByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Device>> GetAllDevicesAsync(CancellationToken cancellationToken = default);
    Task<Device> EnableDeviceAsync(Guid id, bool enable, CancellationToken cancellationToken = default);
    Task<Device> ConfigureDeviceAsync(Guid id, string configuration, CancellationToken cancellationToken = default);
}
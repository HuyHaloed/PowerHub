using MediatR;
using MyIoTPlatform.Application.Features.Devices.DTOs;

namespace MyIoTPlatform.Application.Features.Devices.Commands;

public record RegisterDeviceCommand(string Name, string DeviceId, string Type, string? Label = null, string? Description = null) : IRequest<DeviceDto>;
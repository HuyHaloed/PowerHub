using MediatR;
using MyIoTPlatform.Application.Features.Devices.DTOs;
using System;

namespace MyIoTPlatform.Application.Features.Devices.Commands;

public record UpdateDeviceCommand(Guid Id, string? Name = null, string? Label = null, bool? Enabled = null) : IRequest<DeviceDto?>;
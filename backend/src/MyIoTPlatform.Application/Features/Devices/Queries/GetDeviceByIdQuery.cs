using MediatR;
using MyIoTPlatform.Application.Features.Devices.DTOs;
using System;

namespace MyIoTPlatform.Application.Features.Devices.Queries;

public record GetDeviceByIdQuery(Guid Id) : IRequest<DeviceDto?>;
using MediatR;
using MyIoTPlatform.Application.Features.Devices.DTOs;
using System.Collections.Generic;

namespace MyIoTPlatform.Application.Features.Devices.Queries;

public record GetAllDevicesQuery() : IRequest<IEnumerable<DeviceDto>>;
using MediatR;
using MyIoTPlatform.Application.Features.Devices.DTOs;
using System;

namespace MyIoTPlatform.Application.Features.Devices.Queries;
public record GetDeviceDetailsQuery(Guid Id) : IRequest<DeviceDetailsDto?>; // Có thể null nếu ko tìm thấy
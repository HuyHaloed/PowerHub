using MediatR;
using MyIoTPlatform.Application.Features.Devices.DTOs;
using System;

namespace MyIoTPlatform.Application.Features.Devices.Commands;
public record ControlDeviceCommand(Guid Id, string Status) : IRequest<ControlDeviceResponseDto?>; // Có thể null nếu device ko tồn tại
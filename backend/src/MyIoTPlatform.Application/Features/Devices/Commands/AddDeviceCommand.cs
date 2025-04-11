using MediatR;
using MyIoTPlatform.Application.Features.Devices.DTOs;
using System.Collections.Generic;

namespace MyIoTPlatform.Application.Features.Devices.Commands;
public record AddDeviceCommand(
    string Name,
    string Type,
    string? Location,
    Dictionary<string, string>? Properties
) : IRequest<DeviceSummaryDto>; // Trả về DTO của device vừa tạo
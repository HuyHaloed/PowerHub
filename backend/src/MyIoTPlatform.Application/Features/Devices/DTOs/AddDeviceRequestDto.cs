using System.Collections.Generic;
namespace MyIoTPlatform.Application.Features.Devices.DTOs;
public record AddDeviceRequestDto(
    string Name,
    string Type,
    string? Location,
    Dictionary<string, string>? Properties
);
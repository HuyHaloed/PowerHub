namespace MyIoTPlatform.Application.Features.Devices.DTOs;
public record ControlDeviceResponseDto(Guid Id, string Name, string Status, string Message);
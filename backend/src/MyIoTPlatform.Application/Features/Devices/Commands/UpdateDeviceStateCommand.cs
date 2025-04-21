using MediatR;
namespace MyIoTPlatform.Application.Features.Devices.Commands; // Namespace của bạn
public record UpdateDeviceStateCommand(Guid DeviceId, string StatePayloadJson) : IRequest<Unit>;    
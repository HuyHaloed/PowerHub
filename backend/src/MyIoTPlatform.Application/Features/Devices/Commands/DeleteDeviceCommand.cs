using MediatR;
using System;

namespace MyIoTPlatform.Application.Features.Devices.Commands;
public record DeleteDeviceCommand(Guid Id) : IRequest<bool>; // Trả về true nếu xóa thành công
using MediatR;
using System;

namespace MyIoTPlatform.Application.Features.Devices.Commands;

public record DeleteDeviceCommand(Guid Id) : IRequest;
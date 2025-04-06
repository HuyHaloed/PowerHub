using MediatR;
using MyIoTPlatform.Application.Features.Telemetry.DTOs;
using System;
using System.Collections.Generic;

namespace MyIoTPlatform.Application.Features.Telemetry.Queries;

public record GetLatestTelemetryQuery(Guid DeviceId) : IRequest<IEnumerable<TelemetryDto>>;
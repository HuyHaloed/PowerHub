using MediatR;
using System.Collections.Generic;
using MyIoTPlatform.Application.Features.Telemetry.DTOs;

namespace MyIoTPlatform.Application.Features.Telemetry.Queries
{
    public class GetAllTelemetryQuery : IRequest<List<TelemetryDto>>
    {
        public required string DeviceId { get; set; }
    }
}
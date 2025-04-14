using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MyIoTPlatform.Application.Interfaces.Persistence;
using MyIoTPlatform.Application.Features.Telemetry.DTOs;
using System.Linq;
using MyIoTPlatform.Domain.Interfaces.Repositories;
using System;

namespace MyIoTPlatform.Application.Features.Telemetry.Queries
{
    public class GetAllTelemetryQueryHandler : IRequestHandler<GetAllTelemetryQuery, List<TelemetryDto>>
    {
        private readonly ITelemetryRepository _telemetryRepository;

        public GetAllTelemetryQueryHandler(ITelemetryRepository telemetryRepository)
        {
            _telemetryRepository = telemetryRepository;
        }

        public async Task<List<TelemetryDto>> Handle(GetAllTelemetryQuery request, CancellationToken cancellationToken)
        {
            Guid deviceId = Guid.Parse(request.DeviceId); // Convert string to Guid
            var telemetryData = await _telemetryRepository.GetAllAsync(deviceId, cancellationToken);
            return telemetryData.Select(t => new TelemetryDto
            {
                DeviceId = t.DeviceId,
                Key = t.Key,
                Value = t.Value,
                Timestamp = t.Timestamp
            }).ToList();
        }
    }
}
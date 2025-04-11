using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MyIoTPlatform.Application.Interfaces.Persistence;
using MyIoTPlatform.Application.Features.Telemetry.DTOs;
using System.Linq;

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
            var telemetryData = await _telemetryRepository.GetAllAsync(request.DeviceId);
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
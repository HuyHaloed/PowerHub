using MediatR;
using MyIoTPlatform.Application.Interfaces.Repositories;
using MyIoTPlatform.Application.Features.Telemetry.DTOs;

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
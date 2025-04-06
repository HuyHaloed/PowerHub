using AutoMapper;
using MediatR;
using MyIoTPlatform.Application.Features.Telemetry.DTOs;
using MyIoTPlatform.Domain.Entities;
using MyIoTPlatform.Domain.Interfaces.Repositories;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace MyIoTPlatform.Application.Features.Telemetry.Queries;

public class GetLatestTelemetryQueryHandler : IRequestHandler<GetLatestTelemetryQuery, IEnumerable<TelemetryDto>>
{
    private readonly ITelemetryRepository _telemetryRepository;
    private readonly IMapper _mapper;

    public GetLatestTelemetryQueryHandler(ITelemetryRepository telemetryRepository, IMapper mapper)
    {
        _telemetryRepository = telemetryRepository;
        _mapper = mapper;
    }

    public async Task<IEnumerable<TelemetryDto>> Handle(GetLatestTelemetryQuery request, CancellationToken cancellationToken)
    {
        // Giả sử repository có phương thức GetLatestTelemetryByDeviceIdAsync trả về Dictionary<string, TelemetryData>
        var latestTelemetryData = await _telemetryRepository.GetLatestTelemetryByDeviceIdAsync(request.DeviceId, cancellationToken);

        if (latestTelemetryData == null || !latestTelemetryData.Any())
        {
            return new List<TelemetryDto>();
        }

        // Map Dictionary<string, TelemetryData> sang IEnumerable<TelemetryDto>
        var telemetryDtos = latestTelemetryData.Select(kvp => _mapper.Map<TelemetryDto>(kvp.Value));

        return telemetryDtos;
    }
}
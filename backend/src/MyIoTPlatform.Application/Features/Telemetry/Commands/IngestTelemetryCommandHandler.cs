using MediatR;
using Microsoft.Extensions.Logging;
using MyIoTPlatform.Application.Interfaces.Persistence;
using MyIoTPlatform.Application.Interfaces.Communication;
using MyIoTPlatform.Application.Features.Telemetry.DTOs;
using MyIoTPlatform.Domain.Entities;
using System.Text.Json;

namespace MyIoTPlatform.Application.Features.Telemetry.Commands;

public class IngestTelemetryCommandHandler : IRequestHandler<IngestTelemetryCommand, Unit>
{
    private readonly ITelemetryMongoService _mongoService;

    private readonly ILogger<IngestTelemetryCommandHandler> _logger;
    public IngestTelemetryCommandHandler(
        ITelemetryMongoService mongoService, // Thêm dòng này
        ILogger<IngestTelemetryCommandHandler> logger)
    {
        _mongoService = mongoService;
        _logger = logger;
    }

    public async Task<Unit> Handle(IngestTelemetryCommand request, CancellationToken cancellationToken)
    {
        var telemetry = new TelemetryData
        {
            DeviceId = request.DeviceId,
            Timestamp = DateTime.UtcNow,
            Key = "RawPayload",
            ValueJson = request.PayloadJson
        };

        await _mongoService.InsertTelemetryAsync(telemetry);

        _logger.LogInformation("Saved telemetry to MongoDB for device {DeviceId}", request.DeviceId);
        return Unit.Value;
    }
}

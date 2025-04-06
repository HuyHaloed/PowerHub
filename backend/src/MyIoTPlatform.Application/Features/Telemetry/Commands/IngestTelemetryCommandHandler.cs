using MediatR;
using Microsoft.Extensions.Logging;
using MyIoTPlatform.Application.Interfaces.Persistence; // IApplicationDbContext
using MyIoTPlatform.Application.Interfaces.Communication; // IRealtimeNotifier
using MyIoTPlatform.Domain.Entities;
using System.Text.Json; // Hoặc Newtonsoft.Json

namespace MyIoTPlatform.Application.Features.Telemetry.Commands;

public class IngestTelemetryCommandHandler : IRequestHandler<IngestTelemetryCommand, Unit>
{
    private readonly IApplicationDbContext _context;
    private readonly IRealtimeNotifier _realtimeNotifier;
    private readonly ILogger<IngestTelemetryCommandHandler> _logger;
    // TODO: Inject IMapper nếu cần map sang DTO trước khi gửi qua SignalR

    public IngestTelemetryCommandHandler(
        IApplicationDbContext context,
        IRealtimeNotifier realtimeNotifier,
        ILogger<IngestTelemetryCommandHandler> logger)
    {
        _context = context;
        _realtimeNotifier = realtimeNotifier;
        _logger = logger;
    }

    public async Task<Unit> Handle(IngestTelemetryCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Processing telemetry for device {DeviceId}", request.DeviceId);

        // TODO: Kiểm tra xem DeviceId có tồn tại không (tùy chọn)
        // var device = await _context.Devices.FindAsync(new object[] { request.DeviceId }, cancellationToken);
        // if (device == null) { ... log warning/error ... return Unit.Value; }

        try
        {
            // 1. Parse JSON Payload
            // Ví dụ đơn giản: Lưu toàn bộ JSON vào một cột.
            // Cách khác: Parse thành Dictionary<string, object> hoặc một lớp cụ thể
            //          và lưu từng key-value vào các dòng TelemetryData riêng biệt.
            // Ví dụ này lưu cả cụm JSON:
            var telemetry = new TelemetryData
            {
                // Id = Guid.NewGuid(), // Có thể để DB tự sinh nếu cấu hình
                DeviceId = request.DeviceId,
                Timestamp = DateTime.UtcNow,
                Key = "RawPayload", // Hoặc một key xác định nếu parse chi tiết
                ValueJson = request.PayloadJson // Lưu trữ JSON string
                // ValueNumeric = ..., ValueString = ... (nếu parse chi tiết)
            };

            // 2. Lưu vào Database
            _context.TelemetryData.Add(telemetry);
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Saved telemetry for device {DeviceId}", request.DeviceId);


            // 3. Gửi thông báo Real-time (SignalR)
            // TODO: Map 'telemetry' sang TelemetryDto nếu cần
            // Ví dụ: giả sử TelemetryDto có các trường tương ứng
            var telemetryDto = new TelemetryDto { /* ... map từ telemetry ... */ };
            await _realtimeNotifier.NotifyTelemetryUpdateAsync(request.DeviceId, telemetryDto, cancellationToken);


            // 4. (Tùy chọn) Trigger xử lý ML
            // var mlCommand = new TriggerPredictionCommand(request.DeviceId, telemetry);
            // await _mediator.Send(mlCommand, cancellationToken); // Cần inject ISender vào đây

        }
        catch (JsonException jsonEx)
        {
            _logger.LogError(jsonEx, "Failed to parse telemetry JSON payload for device {DeviceId}. Payload: {Payload}", request.DeviceId, request.PayloadJson);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing telemetry for device {DeviceId}", request.DeviceId);
            // Có thể throw lại exception nếu muốn transaction rollback hoặc xử lý khác
        }

        return Unit.Value; // Trả về Unit khi dùng IRequest<Unit>
    }
}
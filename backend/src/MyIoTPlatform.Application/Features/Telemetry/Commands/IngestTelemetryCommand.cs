using MediatR; // IRequest<TResponse>, dùng Unit nếu không cần giá trị trả về

namespace MyIoTPlatform.Application.Features.Telemetry.Commands;

// deviceId: Thiết bị nào gửi dữ liệu
// PayloadJson: Nội dung dữ liệu dạng JSON string nhận từ MQTT
public record IngestTelemetryCommand(Guid DeviceId, string PayloadJson) : IRequest<Unit>
{
};
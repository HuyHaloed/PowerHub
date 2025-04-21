using MediatR;
using MyIoTPlatform.Domain.Interfaces.Repositories; // Namespace của bạn
using MyIoTPlatform.Application.Interfaces.Communication; // IRealtimeNotifier
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace MyIoTPlatform.Application.Features.Devices.Commands;

public class UpdateDeviceStateCommandHandler : IRequestHandler<UpdateDeviceStateCommand, Unit>
{
    private readonly IDeviceRepository _deviceRepository;
    private readonly IRealtimeNotifier _realtimeNotifier;
    private readonly ILogger<UpdateDeviceStateCommandHandler> _logger;
    // Inject IMapper nếu cần map DTO cho SignalR

    public UpdateDeviceStateCommandHandler(IDeviceRepository deviceRepository, IRealtimeNotifier realtimeNotifier, ILogger<UpdateDeviceStateCommandHandler> logger)
    {
        _deviceRepository = deviceRepository;
        _realtimeNotifier = realtimeNotifier;
        _logger = logger;
    }

    public async Task<Unit> Handle(UpdateDeviceStateCommand request, CancellationToken cancellationToken)
    {
        var device = await _deviceRepository.GetByIdAsync(request.DeviceId, cancellationToken);
        if (device == null)
        {
            _logger.LogWarning("Device not found while processing state update: {DeviceId}", request.DeviceId);
            return Unit.Value;
        }

        try
        {
            // Parse JSON trạng thái từ thiết bị
            // Ví dụ: {"fanState": true, "lightState": false}
            using var jsonDoc = JsonDocument.Parse(request.StatePayloadJson);

            // Cập nhật trạng thái trong đối tượng Device
            bool stateChanged = false;
            if (jsonDoc.RootElement.TryGetProperty("fanState", out var fanStateProp) && fanStateProp.ValueKind == JsonValueKind.True || fanStateProp.ValueKind == JsonValueKind.False)
            {
                var newFanState = fanStateProp.GetBoolean();
                if (device.Status != (newFanState ? "on" : "off")) // Chỉ ví dụ đơn giản, có thể cần trường riêng cho fanState
                {
                     // device.FanStatus = newFanState; // Nếu có trường riêng
                     // Hoặc cập nhật status chung nếu chỉ có 1 trạng thái chính
                     device.Status = newFanState ? "on" : "off"; // Cập nhật status chung
                     stateChanged = true;
                }
            }
             if (jsonDoc.RootElement.TryGetProperty("lightState", out var lightStateProp) && lightStateProp.ValueKind == JsonValueKind.True || lightStateProp.ValueKind == JsonValueKind.False)
            {
                var newLightState = lightStateProp.GetBoolean();
                 // Cập nhật trường riêng cho lightState nếu có
                 // device.LightStatus = newLightState;
                 stateChanged = true; // Giả sử có thay đổi
            }
             // Cập nhật các trạng thái khác nếu có...


            device.LastActivityAt = DateTime.UtcNow; // Cập nhật thời gian hoạt động

            // Chỉ lưu vào DB và thông báo nếu có thay đổi thực sự
            if (stateChanged)
            {
                await _deviceRepository.UpdateAsync(device, cancellationToken); // Dùng ReplaceOneAsync hoặc UpdateOneAsync trong Repo Mongo
                _logger.LogInformation("Updated device state in DB for {DeviceId}", request.DeviceId);

                // Thông báo cho Frontend qua SignalR
                // TODO: Map device sang DTO phù hợp để gửi đi
                // await _realtimeNotifier.NotifyDeviceStatusUpdateAsync(device.Id, device.Status, cancellationToken);
            }
        }
        catch(JsonException jsonEx) {
             _logger.LogError(jsonEx, "Failed to parse state JSON payload for device {DeviceId}. Payload: {Payload}", request.DeviceId, request.StatePayloadJson);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating device state for {DeviceId}", request.DeviceId);
        }

        return Unit.Value;
    }
}
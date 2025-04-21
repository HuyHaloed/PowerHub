using MediatR;
using MyIoTPlatform.Domain.Interfaces.Repositories;
using MyIoTPlatform.Application.Features.Devices.DTOs;
using MyIoTPlatform.Application.Interfaces.Communication; // IMqttClientService
using System.Text.Json;
using Microsoft.Extensions.Logging;
namespace MyIoTPlatform.Application.Features.Devices.Commands;

public class ControlDeviceCommandHandler : IRequestHandler<ControlDeviceCommand, ControlDeviceResponseDto?>
{
    private readonly IDeviceRepository _deviceRepository;
    private readonly IMqttClientService _mqttClientService;
    private readonly IUnitOfWork _unitOfWork;
    // Inject ILogger nếu cần log
    private readonly ILogger<ControlDeviceCommandHandler> _logger;

    public ControlDeviceCommandHandler(IDeviceRepository deviceRepository, IMqttClientService mqttClientService, IUnitOfWork unitOfWork, ILogger<ControlDeviceCommandHandler> logger)
    {
        _deviceRepository = deviceRepository;
        _mqttClientService = mqttClientService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<ControlDeviceResponseDto?> Handle(ControlDeviceCommand request, CancellationToken cancellationToken)
    {
        var device = await _deviceRepository.GetByIdAsync(request.Id, cancellationToken);
        if (device == null) return null;

        var targetStatus = request.Status.ToLowerInvariant();
        if (targetStatus != "on" && targetStatus != "off")
        {
            // Trả về lỗi hoặc thông báo không hợp lệ
            return new ControlDeviceResponseDto(device.Id, device.Name, device.Status, "Invalid target status provided.");
        }

        var controlPayload = JsonSerializer.Serialize(new { status = targetStatus });
        // !! Đảm bảo topic này khớp với topic thiết bị đang subscribe !!
        var controlTopic = $"devices/{device.Id}/control/request";

        try
        {
            await _mqttClientService.PublishAsync(controlTopic, controlPayload, false, 1);
            return new ControlDeviceResponseDto(device.Id, device.Name, $"pending_{targetStatus}", "Control command sent successfully."); // Trạng thái có thể là pending
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish control command for device {DeviceId}", request.Id);
            return new ControlDeviceResponseDto(device.Id, device.Name, device.Status, "Failed to send control command.");
        }
        // !! Không cập nhật device.Status và không SaveChanges ở đây nữa !!
    }
}
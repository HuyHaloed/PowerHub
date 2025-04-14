using MediatR;
using MyIoTPlatform.Domain.Interfaces.Repositories;
using MyIoTPlatform.Application.Features.Devices.DTOs;
using MyIoTPlatform.Application.Interfaces.Communication; // IMqttClientService
using MyIoTPlatform.Application.Interfaces.Persistence; // IUnitOfWork
using System.Text.Json;

namespace MyIoTPlatform.Application.Features.Devices.Commands;

public class ControlDeviceCommandHandler : IRequestHandler<ControlDeviceCommand, ControlDeviceResponseDto?>
{
    private readonly IDeviceRepository _deviceRepository;
    private readonly IMqttClientService _mqttClientService;
    private readonly IUnitOfWork _unitOfWork;
    // Inject ILogger nếu cần log

    public ControlDeviceCommandHandler(IDeviceRepository deviceRepository, IMqttClientService mqttClientService, IUnitOfWork unitOfWork)
    {
        _deviceRepository = deviceRepository;
        _mqttClientService = mqttClientService;
        _unitOfWork = unitOfWork;
    }

    public async Task<ControlDeviceResponseDto?> Handle(ControlDeviceCommand request, CancellationToken cancellationToken)
    {
        var device = await _deviceRepository.GetByIdAsync(request.Id, cancellationToken);

        if (device == null)
        {
            return null; // Không tìm thấy thiết bị
        }

        // Kiểm tra status hợp lệ ("on" hoặc "off")
        var targetStatus = request.Status.ToLowerInvariant();
        if (targetStatus != "on" && targetStatus != "off")
        {
            // Có thể throw ValidationException hoặc trả về lỗi
            return new ControlDeviceResponseDto(device.Id, device.Name, device.Status, "Invalid target status.");
        }

        // Tạo payload gửi qua MQTT
        var controlPayload = JsonSerializer.Serialize(new { status = targetStatus });
        var controlTopic = $"devices/{device.Id}/control/request"; // Ví dụ topic điều khiển

        // Gửi lệnh MQTT
        await _mqttClientService.PublishAsync(controlTopic, controlPayload, false, qosLevel: 1); // Corrected QoS level argument

        // Cập nhật trạng thái trong DB (Cách tiếp cận đơn giản: cập nhật ngay)
        // Cách tốt hơn: Chờ phản hồi từ thiết bị qua MQTT rồi mới cập nhật DB
        device.Status = targetStatus; // Cập nhật trạng thái mong muốn
        // device.LastActivityAt = DateTime.UtcNow; // Có thể cập nhật thời gian
        await _deviceRepository.UpdateAsync(device, cancellationToken); // Đánh dấu entity là Modified
        await _unitOfWork.SaveChangesAsync(cancellationToken); // Lưu thay đổi

        return new ControlDeviceResponseDto(device.Id, device.Name, targetStatus, "Control command sent successfully.");
    }
}
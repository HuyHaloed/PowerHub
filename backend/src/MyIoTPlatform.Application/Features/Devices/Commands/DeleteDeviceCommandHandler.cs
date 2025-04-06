using MediatR;
using MyIoTPlatform.Domain.Interfaces.Repositories;
using System.Threading;
using System.Threading.Tasks;

using MyIoTPlatform.Application.Features.Devices.Commands;

public class DeleteDeviceCommandHandler : IRequestHandler<DeleteDeviceCommand>
{
    private readonly IDeviceRepository _deviceRepository;

    public DeleteDeviceCommandHandler(IDeviceRepository deviceRepository)
    {
        _deviceRepository = deviceRepository;
    }

    public async Task Handle(DeleteDeviceCommand request, CancellationToken cancellationToken)
    {
        var existingDevice = await _deviceRepository.GetByIdAsync(request.Id, cancellationToken);

        if (existingDevice != null)
        {
            await _deviceRepository.DeleteAsync(request.Id, cancellationToken);
            // Có thể cần gọi SaveChangesAsync nếu dùng UnitOfWork pattern
        }
        // Nếu không tìm thấy, bạn có thể chọn không làm gì hoặc ném một exception (ví dụ: DeviceNotFoundException)
    }
}   
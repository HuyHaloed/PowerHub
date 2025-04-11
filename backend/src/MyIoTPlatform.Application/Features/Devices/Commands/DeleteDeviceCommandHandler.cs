using MediatR;
using MyIoTPlatform.Domain.Interfaces.Repositories;
using MyIoTPlatform.Application.Interfaces.Persistence; // IUnitOfWork

namespace MyIoTPlatform.Application.Features.Devices.Commands;
public class DeleteDeviceCommandHandler : IRequestHandler<DeleteDeviceCommand, bool>
{
    private readonly IDeviceRepository _deviceRepository;
     private readonly IUnitOfWork _unitOfWork;

    public DeleteDeviceCommandHandler(IDeviceRepository deviceRepository, IUnitOfWork unitOfWork)
    {
        _deviceRepository = deviceRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(DeleteDeviceCommand request, CancellationToken cancellationToken)
    {
        var device = await _deviceRepository.GetByIdAsync(request.Id, cancellationToken);
        if (device == null)
        {
            return false; // Không tìm thấy để xóa
        }

        await _deviceRepository.DeleteAsync(request.Id, cancellationToken); // Repo chỉ remove khỏi context
        await _unitOfWork.SaveChangesAsync(cancellationToken); // Lưu thay đổi vào DB

        return true;
    }
}
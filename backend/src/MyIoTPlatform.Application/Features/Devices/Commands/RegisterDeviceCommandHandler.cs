using AutoMapper;
using MediatR;
using MyIoTPlatform.Domain.Entities;
using MyIoTPlatform.Domain.Interfaces.Repositories;
using MyIoTPlatform.Application.Features.Devices.DTOs;
using MyIoTPlatform.Application.Features.Devices.Commands;

public class RegisterDeviceCommandHandler : IRequestHandler<RegisterDeviceCommand, DeviceDto>
{
    private readonly IDeviceRepository _deviceRepository;
    private readonly IMapper _mapper; // Inject AutoMapper

    public RegisterDeviceCommandHandler(IDeviceRepository deviceRepository, IMapper mapper)
    {
        _deviceRepository = deviceRepository;
        _mapper = mapper;
    }

    public async Task<DeviceDto> Handle(RegisterDeviceCommand request, CancellationToken cancellationToken)
    {
        var device = new Device
        {
            Id = Guid.NewGuid(), // Hoặc bạn có thể muốn Id được tạo bởi DB
            Name = request.Name,
            Type = request.Type,
            Status = "Registered", // Trạng thái ban đầu
            CreatedAt = DateTime.UtcNow
        };

        await _deviceRepository.AddAsync(device, cancellationToken);

        // Có thể cần gọi SaveChangesAsync nếu dùng UnitOfWork pattern

        return _mapper.Map<DeviceDto>(device); // Map sang DTO để trả về
    }
}
using AutoMapper;
using MediatR;
using MyIoTPlatform.Domain.Interfaces.Repositories;
using MyIoTPlatform.Application.Features.Devices.DTOs;
using MyIoTPlatform.Domain.Entities;
using System.Text.Json; // Hoặc Newtonsoft.Json
using MyIoTPlatform.Application.Interfaces.Persistence; // IUnitOfWork

namespace MyIoTPlatform.Application.Features.Devices.Commands;

public class AddDeviceCommandHandler : IRequestHandler<AddDeviceCommand, DeviceSummaryDto>
{
    private readonly IDeviceRepository _deviceRepository;
    private readonly IMapper _mapper;
    private readonly IUnitOfWork _unitOfWork; // Sử dụng Unit of Work

    public AddDeviceCommandHandler(IDeviceRepository deviceRepository, IMapper mapper, IUnitOfWork unitOfWork)
    {
        _deviceRepository = deviceRepository;
        _mapper = mapper;
        _unitOfWork = unitOfWork; // Inject Unit of Work
    }

    public async Task<DeviceSummaryDto> Handle(AddDeviceCommand request, CancellationToken cancellationToken)
    {
        var device = new Device
        {
            // Id = Guid.NewGuid(), // Nếu muốn client tự sinh Id
            Name = request.Name,
            Type = request.Type,
            Location = request.Location,
            Status = "off", // Trạng thái ban đầu
            CreatedAt = DateTime.UtcNow,
            PropertiesJson = request.Properties != null ? JsonSerializer.Serialize(request.Properties) : "{}" // Ensure non-null value
        };

        await _deviceRepository.AddAsync(device, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken); // Lưu thay đổi vào DB

        return _mapper.Map<DeviceSummaryDto>(device);
    }
}
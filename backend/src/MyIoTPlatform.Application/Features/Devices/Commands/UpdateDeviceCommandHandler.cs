using AutoMapper;
using MediatR;
using MyIoTPlatform.Application.Features.Devices.DTOs;
using MyIoTPlatform.Domain.Entities;
using MyIoTPlatform.Domain.Interfaces.Repositories;
using System.Threading;
using System.Threading.Tasks;

using MyIoTPlatform.Application.Features.Devices.Commands;
using System;

public class UpdateDeviceCommandHandler : IRequestHandler<UpdateDeviceCommand, DeviceDto?>
{
    private readonly IDeviceRepository _deviceRepository;
    private readonly IMapper _mapper;

    public UpdateDeviceCommandHandler(IDeviceRepository deviceRepository, IMapper mapper)
    {
        _deviceRepository = deviceRepository;
        _mapper = mapper;
    }

    public async Task<DeviceDto?> Handle(UpdateDeviceCommand request, CancellationToken cancellationToken)
    {
        var existingDevice = await _deviceRepository.GetByIdAsync(request.Id, cancellationToken);

        if (existingDevice == null)
        {
            Console.WriteLine($"Warning: Device with ID {request.Id} not found for update.");
            return null;
        }

        // Cập nhật các thuộc tính nếu chúng có giá trị
        if (request.Name != null)
        {
            existingDevice.Name = request.Name;
        }
        if (request.Label != null)
        {
            existingDevice.Label = request.Label;
        }
        if (request.Enabled.HasValue)
        {
            existingDevice.Enabled = request.Enabled.Value;
        }

        // Cập nhật thời gian cập nhật
        existingDevice.UpdateAt = DateTime.UtcNow;

        await _deviceRepository.UpdateAsync(existingDevice, cancellationToken);

        return _mapper.Map<DeviceDto>(existingDevice);
    }
}
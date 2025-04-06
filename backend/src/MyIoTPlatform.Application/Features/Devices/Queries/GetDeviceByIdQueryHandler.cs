using AutoMapper;
using MediatR;
using MyIoTPlatform.Application.Features.Devices.DTOs;
using MyIoTPlatform.Domain.Entities;
using MyIoTPlatform.Domain.Interfaces.Repositories;
using System.Threading;
using System.Threading.Tasks;

namespace MyIoTPlatform.Application.Features.Devices.Queries;

public class GetDeviceByIdQueryHandler : IRequestHandler<GetDeviceByIdQuery, DeviceDto?>
{
    private readonly IDeviceRepository _deviceRepository;
    private readonly IMapper _mapper;

    public GetDeviceByIdQueryHandler(IDeviceRepository deviceRepository, IMapper mapper)
    {
        _deviceRepository = deviceRepository;
        _mapper = mapper;
    }

    public async Task<DeviceDto?> Handle(GetDeviceByIdQuery request, CancellationToken cancellationToken)
    {
        var device = await _deviceRepository.GetByIdAsync(request.Id, cancellationToken);

        if (device == null)
        {
            return null; // Trả về null nếu không tìm thấy thiết bị
        }

        return _mapper.Map<DeviceDto>(device); // Map sang DTO để trả về
    }
}
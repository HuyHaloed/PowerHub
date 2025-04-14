using AutoMapper;
using MediatR;
using MyIoTPlatform.Domain.Entities;
using MyIoTPlatform.Domain.Interfaces.Repositories;
using MyIoTPlatform.Application.Features.Devices.DTOs;
using MyIoTPlatform.Application.Features.Devices.Commands;
using MyIoTPlatform.Application.Interfaces.Persistence;
using System.Threading;
using System.Threading.Tasks;

namespace MyIoTPlatform.Application.Features.Devices.Commands
{
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
                Id = Guid.NewGuid(), // Use Guid directly instead of converting to string
                Name = request.DeviceName,
                Type = request.DeviceType,
                Description = request.Description,
                PropertiesJson = "{}" // Ensure PropertiesJson is set
            };

            await _deviceRepository.AddAsync(device, cancellationToken);

            return _mapper.Map<DeviceDto>(device); // Map sang DTO để trả về
        }
    }
}
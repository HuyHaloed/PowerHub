using AutoMapper;
using MyIoTPlatform.Application.Features.Devices.DTOs;
using MyIoTPlatform.Domain.Entities;

namespace MyIoTPlatform.Application.Common.Mappings;

public class DeviceMappingProfile : Profile
{
    public DeviceMappingProfile()
    {
        CreateMap<Device, DeviceDto>();
        CreateMap<DeviceDto, Device>(); // Nếu bạn cần map ngược lại
    }
}
using AutoMapper;
using MediatR;
using MyIoTPlatform.Domain.Interfaces.Repositories;
using MyIoTPlatform.Application.Features.Devices.DTOs;
using MyIoTPlatform.Domain.Entities; // Cần entity để build filter
using System.Linq.Expressions; // Cần cho Expression<>

namespace MyIoTPlatform.Application.Features.Devices.Queries;

public class GetAllDevicesQueryHandler : IRequestHandler<GetAllDevicesQuery, IEnumerable<DeviceSummaryDto>>
{
    private readonly IDeviceRepository _deviceRepository;
    private readonly IMapper _mapper;
    // Inject thêm service để lấy consumption nếu cần

    public GetAllDevicesQueryHandler(IDeviceRepository deviceRepository, IMapper mapper)
    {
        _deviceRepository = deviceRepository;
        _mapper = mapper;
    }

    public async Task<IEnumerable<DeviceSummaryDto>> Handle(GetAllDevicesQuery request, CancellationToken cancellationToken)
    {
        // Xây dựng bộ lọc động dựa trên request parameters
        Expression<Func<Device, bool>>? filter = BuildFilter(request);

        var devices = await _deviceRepository.GetFilteredAsync(filter, cancellationToken);

        // TODO: Lấy thêm dữ liệu consumption cho từng device nếu cần

        return _mapper.Map<IEnumerable<DeviceSummaryDto>>(devices);
    }

    // Hàm helper để tạo biểu thức lọc LINQ
    private Expression<Func<Device, bool>>? BuildFilter(GetAllDevicesQuery request)
    {
        Expression<Func<Device, bool>>? combinedFilter = null;
        ParameterExpression parameter = Expression.Parameter(typeof(Device), "d");

        // Hàm tiện ích để kết hợp các filter bằng AND
        Expression<Func<Device, bool>>? AndAlso(Expression<Func<Device, bool>>? left, Expression<Func<Device, bool>> right)
        {
            if (left == null) return right;
            var invokedExpr = Expression.Invoke(right, left.Parameters);
            return Expression.Lambda<Func<Device, bool>>(Expression.AndAlso(left.Body, invokedExpr), left.Parameters);
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && !request.Status.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
             Expression<Func<Device, bool>> statusFilter = d => d.Status.ToLower() == request.Status.ToLower();
             combinedFilter = AndAlso(combinedFilter, statusFilter);
        }
        if (!string.IsNullOrWhiteSpace(request.Location))
        {
            Expression<Func<Device, bool>> locationFilter = d => d.Location != null && d.Location.ToLower().Contains(request.Location.ToLower());
            combinedFilter = AndAlso(combinedFilter, locationFilter);
        }
         if (!string.IsNullOrWhiteSpace(request.Type))
        {
             Expression<Func<Device, bool>> typeFilter = d => d.Type.ToLower() == request.Type.ToLower();
             combinedFilter = AndAlso(combinedFilter, typeFilter);
        }
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
             Expression<Func<Device, bool>> searchFilter = d => d.Name.ToLower().Contains(request.Search.ToLower()) ||
                                                               (d.Location != null && d.Location.ToLower().Contains(request.Search.ToLower()));
            combinedFilter = AndAlso(combinedFilter, searchFilter);
        }

        // Nếu không có filter nào được áp dụng, trả về null
        return combinedFilter;
    }
}
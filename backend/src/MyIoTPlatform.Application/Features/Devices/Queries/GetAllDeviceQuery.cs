using MediatR;
using MyIoTPlatform.Application.Features.Devices.DTOs;
using System.Collections.Generic;

namespace MyIoTPlatform.Application.Features.Devices.Queries;
// Các tham số lọc từ API documentation
public record GetAllDevicesQuery(
    string? Status,
    string? Location,
    string? Type,
    string? Search
) : IRequest<IEnumerable<DeviceSummaryDto>>;
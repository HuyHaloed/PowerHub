// Ví dụ: DevicesController.cs
using MediatR;
using Microsoft.AspNetCore.Mvc;
using MyIoTPlatform.Application.Features.Devices.Commands;
using MyIoTPlatform.Application.Features.Devices.Queries;
using MyIoTPlatform.Application.Features.Devices.DTOs; // Cần DTO

namespace MyIoTPlatform.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DevicesController : ControllerBase
{
    private readonly ISender _mediator; // Sử dụng ISender thay vì IMediator

    public DevicesController(ISender mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> RegisterDevice([FromBody] RegisterDeviceRequest request)
    {
        // TODO: Map RegisterDeviceRequest sang RegisterDeviceCommand nếu khác nhau
        var command = new RegisterDeviceCommand(request.Name, request.Type);
        var result = await _mediator.Send(command);
        // Trả về CreatedAtAction hoặc Ok tùy theo thiết kế API
        return CreatedAtAction(nameof(GetDeviceById), new { id = result.Id }, result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetDeviceById(Guid id)
    {
        var query = new GetDeviceByIdQuery(id);
        var result = await _mediator.Send(query);
        return result != null ? Ok(result) : NotFound();
    }

    // Thêm các endpoints khác (GetAll, Update, Delete...)
}

// Tạo class RegisterDeviceRequest nếu cần
public record RegisterDeviceRequest(string Name, string Type);
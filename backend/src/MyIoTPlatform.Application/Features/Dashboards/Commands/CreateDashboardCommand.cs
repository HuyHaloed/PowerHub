using MediatR;

namespace MyIoTPlatform.Application.Features.Dashboards.Commands
{
    public class CreateDashboardCommand : IRequest<Unit>
    {
        public required string Name { get; set; } // Added 'required' modifier to ensure initialization
        public required string Layout { get; set; } // Added 'required' modifier to ensure initialization
    }
}
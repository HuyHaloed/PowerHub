using MediatR;
using MyIoTPlatform.Domain.Entities;
using MyIoTPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace MyIoTPlatform.Application.Features.Dashboards.Commands
{
    public class CreateDashboardCommandHandler : IRequestHandler<CreateDashboardCommand, Unit>
    {
        private readonly IDashboardRepository _dashboardRepository;

        public CreateDashboardCommandHandler(IDashboardRepository dashboardRepository)
        {
            _dashboardRepository = dashboardRepository;
        }

        public async Task<Unit> Handle(CreateDashboardCommand request, CancellationToken cancellationToken)
        {
            var dashboard = new Dashboard
            {
                Id = Guid.NewGuid().ToString(),
                Name = request.Name,
                Layout = request.Layout
            };

            await _dashboardRepository.AddAsync(dashboard);

            return Unit.Value;
        }
    }
}
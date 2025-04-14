using MediatR;
using System.Threading;
using System.Threading.Tasks;
using MyIoTPlatform.Application.Interfaces; // Assuming you'll need an interface for ML service
using MyIoTPlatform.Domain.Interfaces.Services;

namespace MyIoTPlatform.Application.Features.MachineLearning.Queries
{
    public class GetModelPerformanceQueryHandler : IRequestHandler<GetModelPerformanceQuery, double>
    {
        private readonly IAzureMlService _azureMlService;

        public GetModelPerformanceQueryHandler(IAzureMlService azureMlService)
        {
            _azureMlService = azureMlService;
        }

        public async Task<double> Handle(GetModelPerformanceQuery request, CancellationToken cancellationToken)
        {
            // Call the Azure ML service to get the model performance
            // Example:
            return await _azureMlService.GetModelPerformanceAsync(request.ModelId);
        }
    }
}
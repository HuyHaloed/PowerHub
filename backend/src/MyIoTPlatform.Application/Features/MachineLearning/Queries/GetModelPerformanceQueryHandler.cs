using MediatR;
using System.Threading;
using System.Threading.Tasks;
using MyIoTPlatform.Domain.Interfaces.Services;
using MyIoTPlatform.Application.Features.MachineLearning.DTOs;
using MyIoTPlatform.Domain.Models;

namespace MyIoTPlatform.Application.Features.MachineLearning.Queries
{
    public class GetModelPerformanceQueryHandler : IRequestHandler<GetModelPerformanceQuery, ModelPerformanceDto>
    {
        private readonly IMachineLearningService _MlService;

        public GetModelPerformanceQueryHandler(IMachineLearningService MlService)
        {
            _MlService = MlService;
        }

        public async Task<ModelPerformanceDto> Handle(GetModelPerformanceQuery request, CancellationToken cancellationToken)
        {
            return await _MlService.GetModelPerformanceAsync(request.ModelId, cancellationToken);
        }
    }
}
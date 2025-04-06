using MediatR;
using MyIoTPlatform.Application.Features.MachineLearning.Services;
using MyIoTPlatform.Application.Features.MachineLearning.Commands;
using System.Threading;
using System.Threading.Tasks;

namespace MyIoTPlatform.Application.Features.MachineLearning.Commands
{
    public class TriggerPredictionCommandHandler : IRequestHandler<TriggerPredictionCommand, string>
    {
        private readonly IAzureMlService _azureMlService;

        public TriggerPredictionCommandHandler(IAzureMlService azureMlService)
        {
            _azureMlService = azureMlService;
        }

        public async Task<string> Handle(TriggerPredictionCommand request, CancellationToken cancellationToken)
        {
            var result = await _azureMlService.PredictAsync(request.DeviceId, request.Temperature, request.Humidity, request.LightIntensity);
            return result;
        }
    }
}

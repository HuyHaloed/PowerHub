using MediatR;
using System.Threading;
using System.Threading.Tasks;
using MyIoTPlatform.Application.Interfaces; // Assuming you'll need an interface for ML service
using MyIoTPlatform.Domain.Interfaces.Services;

namespace MyIoTPlatform.Application.Features.MachineLearning.Commands
{
    public class TrainModelCommandHandler : IRequestHandler<TrainModelCommand, bool>
    {
        private readonly IAzureMlService _azureMlService;

        public TrainModelCommandHandler(IAzureMlService azureMlService)
        {
            _azureMlService = azureMlService;
        }

        public async Task<bool> Handle(TrainModelCommand request, CancellationToken cancellationToken)
        {
            // Call the Azure ML service to train the model
            // Example:
            return await _azureMlService.TrainModelAsync(request.ModelId);
        }
    }
}
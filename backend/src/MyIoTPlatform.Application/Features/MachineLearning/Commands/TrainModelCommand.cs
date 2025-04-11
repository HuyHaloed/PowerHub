using MediatR;

namespace MyIoTPlatform.Application.Features.MachineLearning.Commands
{
    public class TrainModelCommand : IRequest<bool>
    {
        public string ModelId { get; set; }
        // Add other properties needed for training, e.g., data range, algorithm type, etc.
    }
}
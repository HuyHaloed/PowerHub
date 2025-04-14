using MediatR;

namespace MyIoTPlatform.Application.Features.MachineLearning.Commands
{
    public class TrainModelCommand : IRequest<bool>
    {
        public required string ModelId { get; set; } // Added required modifier
        // Add other properties needed for training, e.g., data range, algorithm type, etc.
    }
}
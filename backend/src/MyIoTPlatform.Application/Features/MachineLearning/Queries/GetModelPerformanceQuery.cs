using MediatR;

namespace MyIoTPlatform.Application.Features.MachineLearning.Queries
{
    public class GetModelPerformanceQuery : IRequest<double> // Assuming performance is a double value
    {
        public string ModelId { get; set; }
    }
}
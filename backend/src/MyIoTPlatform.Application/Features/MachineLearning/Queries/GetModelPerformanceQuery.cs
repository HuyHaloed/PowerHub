using MediatR;
using MyIoTPlatform.Domain.Models;
using System;

namespace MyIoTPlatform.Application.Features.MachineLearning.Queries
{
    public class GetModelPerformanceQuery : IRequest<ModelPerformanceDto> // Thêm ": IRequest<ModelPerformanceDto>"
    {
        public string ModelId { get; set; }

        public GetModelPerformanceQuery(string modelId)
        {
            ModelId = modelId;
        }
    }
}
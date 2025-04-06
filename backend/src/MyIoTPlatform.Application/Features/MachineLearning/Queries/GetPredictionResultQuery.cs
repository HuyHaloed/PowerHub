using MediatR;
using MyIoTPlatform.Application.Features.MachineLearning.DTOs;

namespace MyIoTPlatform.Application.Features.MachineLearning.Queries
{
    public class GetPredictionResultQuery : IRequest<PredictionResultDto>
    {
        public Guid DeviceId { get; set; }

        public GetPredictionResultQuery(Guid deviceId)
        {
            DeviceId = deviceId;
        }
    }
}

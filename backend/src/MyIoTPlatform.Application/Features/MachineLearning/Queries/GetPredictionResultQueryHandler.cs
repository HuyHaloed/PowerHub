using MediatR;
using MyIoTPlatform.Application.Interfaces.Persistence; // Đảm bảo dòng này có
using MyIoTPlatform.Application.Features.MachineLearning.DTOs; // Thêm using cho DTO
using System.Threading;
using System.Threading.Tasks;

namespace MyIoTPlatform.Application.Features.MachineLearning.Queries
{
    public class GetPredictionResultQueryHandler : IRequestHandler<GetPredictionResultQuery, PredictionResultDto>
    {
        private readonly IPredictionRepository _predictionRepository;

        public GetPredictionResultQueryHandler(IPredictionRepository predictionRepository)
        {
            _predictionRepository = predictionRepository;
        }

        public async Task<PredictionResultDto> Handle(GetPredictionResultQuery request, CancellationToken cancellationToken)
        {
            var predictionResult = await _predictionRepository.GetLatestPredictionAsync(request.DeviceId);

            // Ở đây, bạn cần map kết quả 'predictionResult' (hiện tại đang là string theo code cũ)
            // sang kiểu PredictionResultDto. Ví dụ:
            if (predictionResult != null)
            {
                return new PredictionResultDto { Result = predictionResult };
            }
            else
            {
                return null; // Hoặc một instance PredictionResultDto khác tùy theo logic của bạn
            }
        }
    }
}
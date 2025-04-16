// MyIoTPlatform.Domain.Interfaces.Services/IMachineLearningService.cs
using MyIoTPlatform.Domain.Models; // Sử dụng namespace mới của ModelPerformanceDto

namespace MyIoTPlatform.Domain.Interfaces.Services
{
    public interface IMachineLearningService
    {
        Task<ModelPerformanceDto> GetModelPerformanceAsync(string modelId, CancellationToken cancellationToken = default);

        // Các phương thức khác tùy theo logic ML của bạn
    }
}
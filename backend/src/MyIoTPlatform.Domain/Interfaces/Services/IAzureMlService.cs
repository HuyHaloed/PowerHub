namespace MyIoTPlatform.Domain.Interfaces.Services
{
    public interface IAzureMlService
    {
        Task<string> PredictAsync(int deviceId, double temperature, double humidity, double lightIntensity);
        Task<bool> TrainModelAsync(string modelId);
        Task<double> GetModelPerformanceAsync(string modelId);
    }
}
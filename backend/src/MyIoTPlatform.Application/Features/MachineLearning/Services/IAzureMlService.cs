using System.Threading.Tasks;

namespace MyIoTPlatform.Application.Features.MachineLearning.Services
{
    public interface IAzureMlService
    {
        Task<string> PredictAsync(int deviceId, double temperature, double humidity, double lightIntensity);
        // add more task
    }
}

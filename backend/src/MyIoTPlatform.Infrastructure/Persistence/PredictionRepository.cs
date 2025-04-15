using MyIoTPlatform.Application.Interfaces.Persistence;

namespace MyIoTPlatform.Infrastructure.Persistence {
    public class PredictionRepository : IPredictionRepository {
        public Task<string?> GetLatestPredictionAsync(Guid deviceId)
        {
            return Task.FromResult<string?>(null);
        }
    }
}
using System;
using System.Threading.Tasks;

namespace MyIoTPlatform.Application.Interfaces.Persistence
{
    public interface IPredictionRepository
    {
        Task<string?> GetLatestPredictionAsync(Guid deviceId);
    }
}
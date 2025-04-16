using MyIoTPlatform.Application.Interfaces.Persistence;
using MyIoTPlatform.Infrastructure.Persistence.DbContexts;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using MyIoTPlatform.Domain.Entities;

namespace MyIoTPlatform.Infrastructure.Persistence.Repositories
{
    public class PredictionRepository : IPredictionRepository
    {
        private readonly ApplicationDbContext _dbContext;

        public PredictionRepository(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Prediction> GetByIdAsync(int id)
        {
            return await _dbContext.Predictions.FindAsync(id);
        }

        public async Task AddAsync(Prediction prediction)
        {
            await _dbContext.Predictions.AddAsync(prediction);
            await _dbContext.SaveChangesAsync();
        }

        public async Task<string?> GetLatestPredictionAsync(Guid deviceId)
        {
            var latestPrediction = await _dbContext.Predictions
                .Where(p => p.DeviceId == deviceId)
                .OrderByDescending(p => p.CreatedDate) // Giả sử có thuộc tính CreatedDate
                .FirstOrDefaultAsync();

            return latestPrediction?.Result; // Giả sử kết quả dự đoán được lưu trong thuộc tính Result
        }
    }
}
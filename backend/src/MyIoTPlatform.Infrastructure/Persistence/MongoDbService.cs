using MongoDB.Driver;
using MyIoTPlatform.Application.Interfaces.Persistence;
using MyIoTPlatform.Domain.Entities;
using Microsoft.Extensions.Options;
using MyIoTPlatform.Infrastructure.Persistence.Settings;

namespace MyIoTPlatform.Infrastructure.Persistence
{
    public class MongoDbService : ITelemetryMongoService
    {
        private readonly IMongoCollection<TelemetryData> _telemetryCollection;

        public MongoDbService(IOptions<MongoDbSettings> mongoSettings)
        {
            var client = new MongoClient(mongoSettings.Value.ConnectionString);
            var database = client.GetDatabase(mongoSettings.Value.DatabaseName);
            _telemetryCollection = database.GetCollection<TelemetryData>("TelemetryData");
        }

        public async Task InsertTelemetryAsync(TelemetryData telemetry)
        {
            await _telemetryCollection.InsertOneAsync(telemetry);
        }
    }
}

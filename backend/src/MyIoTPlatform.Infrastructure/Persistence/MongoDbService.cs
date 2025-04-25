using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Bson;
using MongoDB.Driver;
using MyIoTPlatform.Application.Interfaces.Persistence;
using MyIoTPlatform.Domain.Entities;
using Microsoft.Extensions.Options;
using MyIoTPlatform.Infrastructure.Persistence.Settings;
using System;
using MyIoTPlatform.Infrastructure.Communication.CoreIot.Models;

namespace MyIoTPlatform.Infrastructure.Persistence
{
    public class MongoDbService : ITelemetryMongoService
    {
        private readonly IMongoCollection<TelemetryData> _telemetryCollection;

        public MongoDbService(IOptions<MongoDbSettings> mongoSettings)
        {
            var settings = mongoSettings.Value;

            Console.WriteLine($"[MongoDbService] Loaded MongoDB ConnectionString: '{settings.ConnectionString}'");
            Console.WriteLine($"[MongoDbService] Loaded MongoDB DatabaseName: '{settings.DatabaseName}'");

            if (string.IsNullOrWhiteSpace(settings.ConnectionString))
                throw new ArgumentNullException(nameof(settings.ConnectionString), "MongoDB connection string is null or empty.");
            if (string.IsNullOrWhiteSpace(settings.DatabaseName))
                throw new ArgumentNullException(nameof(settings.DatabaseName), "MongoDB database name is null or empty.");

            // FIX lỗi GuidRepresentation: đăng ký serializer mặc định cho Guid
            BsonSerializer.RegisterSerializer(typeof(Guid), new GuidSerializer(GuidRepresentation.Standard));

            var client = new MongoClient(settings.ConnectionString);
            var database = client.GetDatabase(settings.DatabaseName);
            _telemetryCollection = database.GetCollection<TelemetryData>("TelemetryData");
        }


        public async Task InsertTelemetryAsync(TelemetryData telemetry)
        {
            await _telemetryCollection.InsertOneAsync(telemetry);
        }
        public async Task InsertDeviceAsync(Device device)
        {
            var database = _telemetryCollection.Database;
            var deviceCollection = database.GetCollection<Device>("Devices");
            await deviceCollection.InsertOneAsync(device);
        }

        internal async Task<Device> GetDeviceByIdAsync(string deviceId)
        {
            throw new NotImplementedException();
        }
    }
}
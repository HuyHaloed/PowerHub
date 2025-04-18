// using Microsoft.Extensions.Options;
// using MongoDB.Driver;
// using MyIoTPlatform.API.Models;

// namespace MyIoTPlatform.API.Services
// {
//     public class MongoDbService
//     {
//         private readonly IMongoCollection<Device> _devicesCollection;

//         public MongoDbService(IOptions<MongoDbSettings> mongoDBSettings)
//         {
//             var mongoClient = new MongoClient(mongoDBSettings.Value.ConnectionString);
//             var mongoDatabase = mongoClient.GetDatabase(mongoDBSettings.Value.DatabaseName);
//             _devicesCollection = mongoDatabase.GetCollection<Device>("Devices");
//         }
//         public async Task<List<Device>> GetAllDevicesAsync(string status = null, string location = null, string type = null, string search = null)
//         {
//             var filter = Builders<Device>.Filter.Empty;

//             if (!string.IsNullOrEmpty(status))
//                 filter &= Builders<Device>.Filter.Eq(d => d.Status, status);

//             if (!string.IsNullOrEmpty(location))
//                 filter &= Builders<Device>.Filter.Eq(d => d.Location, location);

//             if (!string.IsNullOrEmpty(type))
//                 filter &= Builders<Device>.Filter.Eq(d => d.Type, type);

//             if (!string.IsNullOrEmpty(search))
//                 filter &= Builders<Device>.Filter.Regex(d => d.Name, new MongoDB.Bson.BsonRegularExpression(search, "i"));

//             return await _devicesCollection.Find(filter).ToListAsync();
//         }
//         public async Task<Device> GetDeviceByIdAsync(string id)
//         {
//             return await _devicesCollection.Find(d => d.Id == id).FirstOrDefaultAsync();
//         }
//         public async Task<List<Device>> GetActiveDevicesAsync()
//         {
//             return await _devicesCollection.Find(d => d.Status == "on").ToListAsync();
//         }
//         public async Task CreateDeviceAsync(Device device)
//         {
//             await _devicesCollection.InsertOneAsync(device);
//         }        public async Task UpdateDeviceAsync(string id, Device device)
//         {
//             await _devicesCollection.ReplaceOneAsync(d => d.Id == id, device);
//         }
//         public async Task<Device> ControlDeviceAsync(string id, string status)
//         {
//             var update = Builders<Device>.Update.Set(d => d.Status, status);
//             return await _devicesCollection.FindOneAndUpdateAsync(d => d.Id == id, update, new FindOneAndUpdateOptions<Device> { ReturnDocument = ReturnDocument.After });
//         }
//         public async Task DeleteDeviceAsync(string id)
//         {
//             await _devicesCollection.DeleteOneAsync(d => d.Id == id);
//         }
//     }
// }

// public class MongoDbSettings
// {
//     public string ConnectionString { get; set; }
//     public string DatabaseName { get; set; }
// }
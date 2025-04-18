// using MongoDB.Bson;
// using MongoDB.Bson.Serialization.Attributes;

// namespace MyIoTPlatform.API.Models
// {
//     public class Device
//     {
//         [BsonId]
//         [BsonRepresentation(BsonType.ObjectId)]
//         public string Id { get; set; }
        
//         public string UserId { get; set; }
        
//         public string Name { get; set; }
        
//         public string Type { get; set; }
        
//         public string Location { get; set; }
        
//         public string Status { get; set; } // "on" hoặc "off"
        
//         public double Consumption { get; set; }
        
//         public string LastUpdated { get; set; }
        
//         public DeviceProperties Properties { get; set; }
//     }

//     public class DeviceProperties
//     {
//         public string Brand { get; set; }
        
//         public string Model { get; set; }
        
//         public string SerialNumber { get; set; }
        
//         public string InstallDate { get; set; }
        
//         public int PowerRating { get; set; }
//     }
// }
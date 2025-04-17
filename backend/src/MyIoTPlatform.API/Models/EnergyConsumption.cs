using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace MyIoTPlatform.API.Models
{
    public class EnergyConsumption
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string UserId { get; set; }

        public string DeviceId { get; set; }

        public double Value { get; set; }

        public DateTime Date { get; set; }
    }
}
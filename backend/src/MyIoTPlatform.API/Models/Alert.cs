// // src/Models/Alert.cs
// using MongoDB.Bson;
// using MongoDB.Bson.Serialization.Attributes;
// using System;

// namespace MyIoTPlatform.API.Models
// {
//     public class Alert
//     {
//         [BsonId]
//         [BsonRepresentation(BsonType.ObjectId)]
//         public string Id { get; set; }

//         public string UserId { get; set; }

//         public string Title { get; set; }

//         public string Message { get; set; }

//         public string Severity { get; set; } // info, warning, error

//         public bool Read { get; set; }

//         public DateTime Date { get; set; }
//     }
// }


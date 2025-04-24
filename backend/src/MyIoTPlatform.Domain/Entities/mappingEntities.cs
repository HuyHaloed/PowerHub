// using MongoDB.Bson;
// using MongoDB.Bson.Serialization.Attributes;
// using System;
// using System.Collections.Generic;

// namespace MyIoTPlatform.Domain.Entities
// {
//     public class User
//     {
//         [BsonId]
//         public Guid Id { get; set; }
//         public string Username { get; set; }
//         public string PasswordHash { get; set; }
//         public string FullName { get; set; }
//         public string Email { get; set; }
//         public DateTime CreatedAt { get; set; }
//     }

//     public class Device
//     {
//         [BsonId]
//         public Guid Id { get; set; }
//         public string DeviceName { get; set; }
//         public string Description { get; set; }
//         public Guid UserId { get; set; }
//         public string Location { get; set; }
//         public bool IsOnline { get; set; }
//     }

//     public class Sensor
//     {
//         [BsonId]
//         public Guid Id { get; set; }
//         public string Type { get; set; } // e.g. temperature, humidity
//         public string Unit { get; set; }
//         public Guid DeviceId { get; set; }
//     }

//     public class EnvironmentData
//     {
//         [BsonId]
//         public Guid Id { get; set; }
//         public Guid SensorId { get; set; }
//         public DateTime Timestamp { get; set; }
//         public double Value { get; set; }
//     }

//     public class CommandList
//     {
//         [BsonId]
//         public Guid Id { get; set; }
//         public Guid DeviceId { get; set; }
//         public string Command { get; set; } // e.g. TURN_ON, TURN_OFF
//         public DateTime ExecutedAt { get; set; }
//         public bool Success { get; set; }
//         public string ExecutedBy { get; set; } // Username or user ID
//     }

//     public class Notification
//     {
//         [BsonId]
//         public Guid Id { get; set; }
//         public Guid UserId { get; set; }
//         public string Message { get; set; }
//         public DateTime Timestamp { get; set; }
//         public bool IsRead { get; set; }
//     }

//     public class AuthenicationLog
//     {
//         [BsonId]
//         public Guid Id { get; set; }
//         public Guid UserId { get; set; }
//         public DateTime LoginTime { get; set; }
//         public string IPAddress { get; set; }
//         public bool IsSuccessful { get; set; }
//     }

//     public class Avatar
//     {
//         [BsonId]
//         public Guid Id { get; set; }
//         public Guid UserId { get; set; }
//         public string FileName { get; set; }
//         public string ContentType { get; set; }
//         public byte[] ImageData { get; set; }
//     }

//     public class Train
//     {
//         [BsonId]
//         public Guid Id { get; set; }
//         public Guid UserId { get; set; }
//         public string TrainData { get; set; } // JSON or Base64 encoded
//         public DateTime CreatedAt { get; set; }
//     }

//     public class SystemInfo
//     {
//         [BsonId]
//         public Guid Id { get; set; }
//         public string Key { get; set; }
//         public string Value { get; set; }
//     }

//     public class Interact
//     {
//         [BsonId]
//         public Guid Id { get; set; }
//         public Guid UserId { get; set; }
//         public string Action { get; set; }
//         public DateTime Timestamp { get; set; }
//         public string Target { get; set; } // e.g. deviceId, command, etc.
//     }

//     public class Operation
//     {
//         [BsonId]
//         public Guid Id { get; set; }
//         public Guid DeviceId { get; set; }
//         public string Name { get; set; }
//         public string Description { get; set; }
//         public DateTime CreatedAt { get; set; }
//     }
// }

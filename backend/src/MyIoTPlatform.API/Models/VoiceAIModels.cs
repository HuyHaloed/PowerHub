// using System.Text.Json.Serialization;

// namespace MyIoTPlatform.API.Models
// {
//     // Request and response models for voice AI integration

//     public class ChatRequest
//     {
//         public string Message { get; set; }
//         public string SessionId { get; set; }
//     }

//     public class ChatResponse
//     {
//         public string Response { get; set; }
//         public string SessionId { get; set; }
//         public bool IsCommand { get; set; }
//         public CommandPayload CommandPayload { get; set; }
//     }

//     public class VoiceCommandRequest
//     {
//         public string Text { get; set; }
//     }

//     public class VoiceCommandResponse
//     {
//         public string Status { get; set; }
//         public string Message { get; set; } 
//         public Dictionary<string, bool> Payload { get; set; }
//     }

//     public class CommandPayload
//     {
//         public string Status { get; set; }
        
//         public CommandData Payload { get; set; }
//     }

//     public class CommandData
//     {
//         public string Method { get; set; }
        
//         [JsonPropertyName("params")]
//         public Dictionary<string, bool> Parameters { get; set; }
//     }

//     public class AIProcessingResult
//     {
//         public string ResponseText { get; set; }
//         public bool IsCommand { get; set; }
//         public CommandPayload CommandPayload { get; set; }
//     }

//     public class EnvironmentPrediction
//     {
//         public double PredictedTemperature { get; set; }
//         public double PredictedHumidity { get; set; }
//         public DateTime PredictionTime { get; set; }
//         public int HorizonMinutes { get; set; }
//     }
// }
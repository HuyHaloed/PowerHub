// using System.Text;
// using System.Text.Json;
// using Microsoft.Extensions.Logging;
// using Microsoft.Extensions.Options;
// using MyIoTPlatform.API.Models;

// namespace MyIoTPlatform.API.Services
// {
//     public class VoiceAIService
//     {
//         private readonly AIApiClient _aiApiClient;
//         private readonly MongoDbService _mongoDbService;
//         private readonly ILogger<VoiceAIService> _logger;
//         private readonly VoiceAISettings _settings;

//         public VoiceAIService(
//             AIApiClient aiApiClient,
//             MongoDbService mongoDbService,
//             ILogger<VoiceAIService> logger,
//             IOptions<VoiceAISettings> settings)
//         {
//             _aiApiClient = aiApiClient;
//             _mongoDbService = mongoDbService;
//             _logger = logger;
//             _settings = settings.Value;
//         }

//         public async Task<AIProcessingResult> ProcessMessageAsync(string message, string userId, string sessionId = null)
//         {
//             try
//             {
//                 _logger.LogInformation($"Processing message: {message}");

//                 // First, try to interpret as a voice command
//                 var commandResponse = await InterpretVoiceCommandAsync(message);
                
//                 // If it's a recognized command, handle it
//                 if (commandResponse.Status == "OK" && commandResponse.Payload != null)
//                 {
//                     // Create command payload
//                     var commandPayload = new CommandPayload
//                     {
//                         Status = "OK",
//                         Payload = new CommandData
//                         {
//                             Method = "setValue",
//                             Parameters = commandResponse.Payload
//                         }
//                     };

//                     // Execute the command
//                     await ExecuteDeviceCommandAsync(userId, commandResponse.Payload);

//                     // Generate response text based on command
//                     string responseText = GenerateCommandResponseText(commandResponse.Payload);

//                     return new AIProcessingResult
//                     {
//                         ResponseText = responseText,
//                         IsCommand = true,
//                         CommandPayload = commandPayload
//                     };
//                 }
//                 else if (commandResponse.Status == "STOP")
//                 {
//                     // Handle STOP command
//                     return new AIProcessingResult
//                     {
//                         ResponseText = "Tôi sẽ dừng nghe lệnh. Hẹn gặp lại bạn sau!",
//                         IsCommand = false,
//                         CommandPayload = null
//                     };
//                 }

//                 // If not a command or unrecognized, check if it's asking about predictions
//                 if (IsPredictionQuery(message))
//                 {
//                     var prediction = await GetEnvironmentPredictionAsync(userId);
//                     return new AIProcessingResult
//                     {
//                         ResponseText = $"Dự báo nhiệt độ trong {prediction.HorizonMinutes} phút tới là {prediction.PredictedTemperature:F1}°C và độ ẩm là {prediction.PredictedHumidity:F1}%.",
//                         IsCommand = false,
//                         CommandPayload = null
//                     };
//                 }

//                 // For other queries, provide a generic response
//                 return new AIProcessingResult
//                 {
//                     ResponseText = GenerateGenericResponse(message),
//                     IsCommand = false,
//                     CommandPayload = null
//                 };
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error processing message");
//                 throw;
//             }
//         }

//         public async Task<VoiceCommandResponse> InterpretVoiceCommandAsync(string text)
// {
//     try
//     {
//         // Input validation
//         if (string.IsNullOrWhiteSpace(text))
//         {
//             _logger.LogWarning("Empty voice command received");
//             return new VoiceCommandResponse 
//             { 
//                 Status = "UNRECOGNIZED", 
//                 Message = "Empty command",
//                 Payload = null 
//             };
//         }

//         // Sanitize input 
//         text = text.Trim();

//         return await _aiApiClient.InterpretVoiceCommandAsync(text);
//         }
//         catch (Exception ex)
//         {
//             _logger.LogError(ex, $"Unexpected error interpreting voice command: {text}");
//             return new VoiceCommandResponse
//             {
//                 Status = "ERROR",
//                 Message = "Internal processing error",
//                 Payload = null
//             };
//         }
//     }

//         public async Task ExecuteDeviceCommandAsync(string userId, Dictionary<string, bool> commandPayload)
//         {
//             foreach (var command in commandPayload)
//             {
//                 string deviceType = null;
                
//                 // Extract device type from the sharevalue key
//                 if (command.Key == "sharevalueLight")
//                 {
//                     deviceType = "Light";
//                 }
//                 else if (command.Key == "sharevalueFan")
//                 {
//                     deviceType = "Fan"; 
//                 }
                
//                 if (deviceType != null)
//                 {
//                     try
//                     {
//                         // Find the matching device by type
//                         var devices = await _mongoDbService.GetDevicesByUserIdAsync(userId, type: deviceType);
//                         var device = devices.FirstOrDefault();
                        
//                         if (device != null)
//                         {
//                             // Control the device
//                             await _mongoDbService.ControlDeviceAsync(device.Id, command.Value ? "ON" : "OFF");
//                             _logger.LogInformation($"Controlled {deviceType} with ID {device.Id} to {(command.Value ? "ON" : "OFF")}");
//                         }
//                         else
//                         {
//                             _logger.LogWarning($"No {deviceType} device found for user {userId}");
//                         }
//                     }
//                     catch (Exception ex)
//                     {
//                         _logger.LogError(ex, $"Error controlling {deviceType} device");
//                     }
//                 }
//             }
//         }

//         public async Task<EnvironmentPrediction> GetEnvironmentPredictionAsync(string userId)
//         {
//             try
//             {
//                 // Get predictions from AI module
//                 var (predictedTemp, predictedHumid) = await _aiApiClient.GetEnvironmentPredictionAsync();
                
//                 // Default values if prediction is null
//                 double temperature = predictedTemp ?? 0;
//                 double humidity = predictedHumid ?? 0;
                
//                 // Get the prediction horizon from settings
//                 int horizonMinutes = _settings.PredictionHorizonMinutes;

//                 // Store prediction in database if we got valid values
//                 if (predictedTemp.HasValue && predictedHumid.HasValue)
//                 {
//                     var latestEnvData = await _mongoDbService.GetLatestEnvironmentDataForUserAsync(userId);
//                     if (latestEnvData != null)
//                     {
//                         var envData = new EnvironmentData
//                         {
//                             UserId = userId,
//                             Temperature = temperature,
//                             Humidity = humidity,
//                             Timestamp = DateTime.UtcNow,
//                             Location = latestEnvData.Location
//                         };
                        
//                         await _mongoDbService.AddEnvironmentDataAsync(envData);
//                     }
//                 }

//                 return new EnvironmentPrediction
//                 {
//                     PredictedTemperature = temperature,
//                     PredictedHumidity = humidity,
//                     PredictionTime = DateTime.UtcNow,
//                     HorizonMinutes = horizonMinutes
//                 };
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error getting environment prediction");
//                 throw;
//             }
//         }

//         private bool IsPredictionQuery(string message)
//         {
//             // Check if the message is asking about prediction, temperature, or humidity forecasts
//             string lowercaseMessage = message.ToLower();
//             string[] predictionKeywords = {
//                 "dự báo", "dự đoán", "tiên đoán", "thời tiết", "nhiệt độ", "độ ẩm", "sẽ như thế nào",
//                 "prediction", "forecast", "temperature", "humidity"
//             };
            
//             return predictionKeywords.Any(keyword => lowercaseMessage.Contains(keyword));
//         }

//         private string GenerateCommandResponseText(Dictionary<string, bool> commandPayload)
//         {
//             List<string> responses = new List<string>();
            
//             foreach (var command in commandPayload)
//             {
//                 if (command.Key == "sharevalueLight")
//                 {
//                     responses.Add(command.Value ? 
//                         "Đã bật đèn cho bạn." : 
//                         "Đã tắt đèn cho bạn.");
//                 }
//                 else if (command.Key == "sharevalueFan")
//                 {
//                     responses.Add(command.Value ? 
//                         "Đã bật quạt cho bạn." : 
//                         "Đã tắt quạt cho bạn.");
//                 }
//             }
            
//             return string.Join(" ", responses);
//         }

//         private string GenerateGenericResponse(string message)
//         {
//             // Simple response generation based on message content
//             string lowercaseMessage = message.ToLower();
            
//             if (lowercaseMessage.Contains("xin chào") || lowercaseMessage.Contains("hello"))
//             {
//                 return "Xin chào! Tôi là trợ lý ảo của bạn. Tôi có thể giúp bạn điều khiển thiết bị hoặc cung cấp thông tin về môi trường.";
//             }
//             else if (lowercaseMessage.Contains("cảm ơn") || lowercaseMessage.Contains("thank"))
//             {
//                 return "Không có gì! Rất vui được giúp đỡ bạn.";
//             }
//             else if (lowercaseMessage.Contains("thời tiết") || lowercaseMessage.Contains("weather"))
//             {
//                 return "Để biết dự báo thời tiết, bạn có thể hỏi 'Dự báo nhiệt độ là bao nhiêu?'";
//             }
//             else if (lowercaseMessage.Contains("thiết bị") || lowercaseMessage.Contains("device"))
//             {
//                 return "Tôi có thể giúp bạn điều khiển thiết bị. Hãy thử nói 'Bật đèn' hoặc 'Tắt quạt'.";
//             }
//             else
//             {
//                 return "Tôi chưa hiểu rõ yêu cầu của bạn. Tôi có thể giúp bạn điều khiển thiết bị với các lệnh như 'Bật đèn' hoặc 'Tắt quạt', hoặc cung cấp dự báo môi trường.";
//             }
//         }
//     }

//     public class VoiceAISettings
//     {
//         public string BaseUrl { get; set; } = "http://localhost:8000/";
//         public int PredictionHorizonMinutes { get; set; } = 60;
//     }
// }
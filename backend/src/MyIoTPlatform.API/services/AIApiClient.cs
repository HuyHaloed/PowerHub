// using System.Net.Http.Json;
// using System.Text;
// using System.Text.Json;
// using Microsoft.Extensions.Logging;
// using Microsoft.Extensions.Options;
// using MyIoTPlatform.API.Models;

// namespace MyIoTPlatform.API.Services
// {
//     /// <summary>
//     /// Client for communicating with the AI module API
//     /// </summary>
//     public class AIApiClient
//     {
//         private readonly HttpClient _httpClient;
//         private readonly ILogger<AIApiClient> _logger;
//         private readonly VoiceAISettings _settings;
//         private readonly JsonSerializerOptions _jsonOptions;

//         public AIApiClient(
//             HttpClient httpClient,
//             ILogger<AIApiClient> logger,
//             IOptions<VoiceAISettings> settings)
//         {
//             _httpClient = httpClient;
//             _logger = logger;
//             _settings = settings.Value;

//             // Configure HttpClient base address
//             _httpClient.BaseAddress = new Uri(_settings.BaseUrl);
            
//             // Configure JSON options
//             _jsonOptions = new JsonSerializerOptions
//             {
//                 PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
//                 WriteIndented = false
//             };
//         }

//         /// <summary>
//         /// Interprets a voice command using the AI module
//         /// </summary>
//         /// <param name="text">The text to interpret</param>
//         /// <returns>The interpretation result</returns>
//         public async Task<VoiceCommandResponse> InterpretVoiceCommandAsync(string text)
//         {
//             try
//             {
//                 // Validate input
//                 if (string.IsNullOrWhiteSpace(text))
//                 {
//                     _logger.LogWarning("Attempted to interpret empty voice command");
//                     return new VoiceCommandResponse 
//                     { 
//                         Status = "ERROR", 
//                         Message = "Empty voice command",
//                         Payload = null 
//                     };
//                 }

//                 _logger.LogInformation($"Sending text for voice interpretation: {text}");
                
//                 var requestData = new { text };
//                 var content = new StringContent(
//                     JsonSerializer.Serialize(requestData, _jsonOptions),
//                     Encoding.UTF8, 
//                     "application/json");
                
//                 // Set a reasonable timeout
//                 _httpClient.Timeout = TimeSpan.FromSeconds(30);
                
//                 HttpResponseMessage response;
//                 try 
//                 {
//                     response = await _httpClient.PostAsync("voice", content);
//                 }
//                 catch (TaskCanceledException ex)
//                 {
//                     _logger.LogError(ex, "Voice interpretation request timed out");
//                     return new VoiceCommandResponse 
//                     { 
//                         Status = "ERROR", 
//                         Message = "Request timed out",
//                         Payload = null 
//                     };
//                 }
//                 catch (HttpRequestException ex)
//                 {
//                     _logger.LogError(ex, "Network error during voice interpretation");
//                     return new VoiceCommandResponse 
//                     { 
//                         Status = "ERROR", 
//                         Message = "Network error",
//                         Payload = null 
//                     };
//                 }

//                 // Additional error handling for non-success status codes
//                 if (!response.IsSuccessStatusCode)
//                 {
//                     // Log the full error response
//                     var errorContent = await response.Content.ReadAsStringAsync();
//                     _logger.LogError($"Voice interpretation failed. Status: {response.StatusCode}. Content: {errorContent}");
                    
//                     return new VoiceCommandResponse 
//                     { 
//                         Status = "ERROR", 
//                         Message = $"Server returned {response.StatusCode}",
//                         Payload = null 
//                     };
//                 }
                
//                 // Deserialize response
//                 var responseContent = await response.Content.ReadAsStreamAsync();
//                 VoiceCommandResponse result;
//                 try 
//                 {
//                     result = await JsonSerializer.DeserializeAsync<VoiceCommandResponse>(
//                         responseContent, 
//                         _jsonOptions);
//                 }
//                 catch (JsonException ex)
//                 {
//                     _logger.LogError(ex, "Failed to deserialize voice interpretation response");
//                     return new VoiceCommandResponse 
//                     { 
//                         Status = "ERROR", 
//                         Message = "Invalid response format",
//                         Payload = null 
//                     };
//                 }
                
//                 return result ?? new VoiceCommandResponse 
//                 { 
//                     Status = "ERROR", 
//                     Message = "Empty response",
//                     Payload = null 
//                 };
//             }
//             catch (Exception ex)
//             {
//                 // Catch-all for any unexpected errors
//                 _logger.LogError(ex, "Unexpected error during voice command interpretation");
//                 return new VoiceCommandResponse
//                 {
//                     Status = "ERROR",
//                     Message = "Unexpected error",
//                     Payload = null
//                 };
//             }
//         }

//         /// <summary>
//         /// Gets environment predictions from the AI module
//         /// </summary>
//         /// <returns>Predicted temperature and humidity</returns>
//         public async Task<(double? Temperature, double? Humidity)> GetEnvironmentPredictionAsync()
//         {
//             try
//             {
//                 _logger.LogInformation("Requesting environment prediction from AI module");
                
//                 var response = await _httpClient.GetAsync("predict");
//                 response.EnsureSuccessStatusCode();
                
//                 var responseContent = await response.Content.ReadAsStreamAsync();
//                 var result = await JsonSerializer.DeserializeAsync<JsonElement>(
//                     responseContent, 
//                     _jsonOptions);
                
//                 double? temperature = null;
//                 double? humidity = null;
                
//                 if (result.TryGetProperty("predicted_temperature", out var tempElement) && 
//                     tempElement.ValueKind != JsonValueKind.Null)
//                 {
//                     temperature = tempElement.GetDouble();
//                 }
                
//                 if (result.TryGetProperty("predicted_humidity", out var humidElement) && 
//                     humidElement.ValueKind != JsonValueKind.Null)
//                 {
//                     humidity = humidElement.GetDouble();
//                 }
                
//                 return (temperature, humidity);
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error getting environment prediction");
//                 return (null, null);
//             }
//         }

//         /// <summary>
//         /// Makes AI prediction using provided sensor data
//         /// </summary>
//         /// <param name="sensorData">The sensor data to use for prediction</param>
//         /// <returns>Predicted temperature and humidity</returns>
//         public async Task<(double? Temperature, double? Humidity)> MakePredictionWithDataAsync(Dictionary<string, object> sensorData)
//         {
//             try
//             {
//                 _logger.LogInformation("Sending sensor data for prediction");
                
//                 var content = new StringContent(
//                     JsonSerializer.Serialize(sensorData, _jsonOptions),
//                     Encoding.UTF8,
//                     "application/json");
                
//                 var response = await _httpClient.PostAsync("predict", content);
//                 response.EnsureSuccessStatusCode();
                
//                 var responseContent = await response.Content.ReadAsStreamAsync();
//                 var result = await JsonSerializer.DeserializeAsync<JsonElement>(
//                     responseContent, 
//                     _jsonOptions);
                
//                 double? temperature = null;
//                 double? humidity = null;
                
//                 if (result.TryGetProperty("predicted_temperature", out var tempElement) && 
//                     tempElement.ValueKind != JsonValueKind.Null)
//                 {
//                     temperature = tempElement.GetDouble();
//                 }
                
//                 if (result.TryGetProperty("predicted_humidity", out var humidElement) && 
//                     humidElement.ValueKind != JsonValueKind.Null)
//                 {
//                     humidity = humidElement.GetDouble();
//                 }
                
//                 return (temperature, humidity);
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error making prediction with data");
//                 return (null, null);
//             }
//         }
//     }
// }
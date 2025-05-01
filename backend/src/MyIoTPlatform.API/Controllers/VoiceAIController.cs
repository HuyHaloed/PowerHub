using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MyIoTPlatform.API.Models;
using MyIoTPlatform.API.Services;

namespace MyIoTPlatform.API.Controllers
{
    [ApiController]
    [Route("api/voice-ai")]
    [Authorize]
    public class VoiceAIController : ControllerBase
    {
        private readonly ILogger<VoiceAIController> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly string _aiServiceUrl;
        private readonly MongoDbService _mongoDbService;
        private readonly bool _useLocalFallback;
        
        // In-memory dictionary for basic chat responses in English when AI service is unavailable
        private static readonly Dictionary<string, string> _fallbackResponsesEn = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "hello", "Hello! How can I help you with your smart home today?" },
            { "hi", "Hi there! I'm your smart home assistant. How can I help?" },
            { "how are you", "I'm functioning well, thank you! How can I assist with your smart home?" },
            { "help", "You can ask me about the weather, control your devices, or get information about your home." },
            { "goodbye", "Goodbye! Have a great day!" },
            { "bye", "Bye! Feel free to ask for help anytime." },
            { "thank you", "You're welcome! Is there anything else you need?" },
            { "thanks", "Happy to help! Anything else you'd like assistance with?" },
            { "what can you do", "I can help control your smart home devices, answer questions about your home's environment, and assist with various tasks." },
            { "weather", "I can tell you about the current weather conditions if you ask specifically about a location." },
            { "temperature", "Would you like to know the current temperature inside your home or outside?" },
            { "music", "I can help you control your music system. What would you like to listen to?" },
            { "tell me a joke", "Why don't scientists trust atoms? Because they make up everything!" },
            { "who are you", "I'm your smart home AI assistant, designed to help you control devices and answer questions about your home." }
        };
        
        // In-memory dictionary for basic chat responses in Vietnamese when AI service is unavailable
        private static readonly Dictionary<string, string> _fallbackResponsesVi = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "xin chào", "Xin chào! Tôi có thể giúp gì cho ngôi nhà thông minh của bạn hôm nay?" },
            { "chào", "Chào bạn! Tôi là trợ lý nhà thông minh của bạn. Tôi có thể giúp gì không?" },
            { "bạn khỏe không", "Tôi đang hoạt động tốt, cảm ơn bạn! Tôi có thể giúp gì với ngôi nhà thông minh của bạn?" },
            { "giúp đỡ", "Bạn có thể hỏi tôi về thời tiết, điều khiển thiết bị, hoặc lấy thông tin về ngôi nhà của bạn." },
            { "tạm biệt", "Tạm biệt! Chúc bạn một ngày tốt lành!" },
            { "bye", "Tạm biệt! Hãy hỏi tôi bất cứ khi nào bạn cần giúp đỡ." },
            { "cảm ơn", "Không có gì! Bạn cần gì nữa không?" },
            { "bạn có thể làm gì", "Tôi có thể giúp điều khiển các thiết bị thông minh, trả lời câu hỏi về môi trường ngôi nhà, và hỗ trợ với nhiều nhiệm vụ khác." },
            { "thời tiết", "Tôi có thể cho bạn biết về tình hình thời tiết hiện tại nếu bạn hỏi cụ thể về một địa điểm." },
            { "nhiệt độ", "Bạn muốn biết nhiệt độ hiện tại trong nhà hay bên ngoài?" },
            { "nhạc", "Tôi có thể giúp bạn điều khiển hệ thống âm nhạc. Bạn muốn nghe gì?" },
            { "kể chuyện cười", "Tại sao các nhà khoa học không tin vào nguyên tử? Vì chúng tạo ra mọi thứ!" },
            { "bạn là ai", "Tôi là trợ lý AI nhà thông minh của bạn, được thiết kế để giúp bạn điều khiển thiết bị và trả lời câu hỏi về ngôi nhà của bạn." }
        };
        
        // Basic command patterns for local fallback processing in English
        private static readonly Dictionary<string, CommandInfo> _commandPatternsEn = new Dictionary<string, CommandInfo>
        {
            { @"(turn|switch)\s+on\s+.*(light|lamp)", new CommandInfo("setValue", "light", true) },
            { @"(turn|switch)\s+off\s+.*(light|lamp)", new CommandInfo("setValue", "light", false) },
            { @"(turn|switch)\s+on\s+.*(fan|ac|air conditioner)", new CommandInfo("setValue", "fan", true) },
            { @"(turn|switch)\s+off\s+.*(fan|ac|air conditioner)", new CommandInfo("setValue", "fan", false) },
            { @"(turn|switch)\s+on\s+.*(heater|heating)", new CommandInfo("setValue", "heater", true) },
            { @"(turn|switch)\s+off\s+.*(heater|heating)", new CommandInfo("setValue", "heater", false) },
            { @"(turn|switch)\s+on\s+.*(tv|television)", new CommandInfo("setValue", "tv", true) },
            { @"(turn|switch)\s+off\s+.*(tv|television)", new CommandInfo("setValue", "tv", false) },
            { @"(open|raise)\s+.*(curtain|blind|shade)", new CommandInfo("setValue", "curtain", true) },
            { @"(close|lower)\s+.*(curtain|blind|shade)", new CommandInfo("setValue", "curtain", false) },
            { @"(play|start)\s+music", new CommandInfo("setValue", "music", true) },
            { @"(stop|pause)\s+music", new CommandInfo("setValue", "music", false) },
            { @"set\s+temperature\s+to\s+(\d+)", new CommandInfo("setTemperature", "thermostat", true, "temperature") },
            { @"increase\s+volume", new CommandInfo("adjustValue", "speaker", true) },
            { @"decrease\s+volume", new CommandInfo("adjustValue", "speaker", false) },
            { @"lock\s+.*(door|doors)", new CommandInfo("setValue", "door", true) },
            { @"unlock\s+.*(door|doors)", new CommandInfo("setValue", "door", false) }
        };
        private static readonly Dictionary<string, CommandInfo> _commandPatternsVi = new Dictionary<string, CommandInfo>
        {
            { @"(bật|mở)\s+.*(đèn|ánh sáng)", new CommandInfo("setValue", "light", true) },
            { @"(tắt)\s+.*(đèn|ánh sáng)", new CommandInfo("setValue", "light", false) },
            { @"(bật|mở)\s+.*(quạt|điều hòa|máy lạnh)", new CommandInfo("setValue", "fan", true) },
            { @"(tắt)\s+.*(quạt|điều hòa|máy lạnh)", new CommandInfo("setValue", "fan", false) },
            { @"(bật|mở)\s+.*(máy sưởi|lò sưởi)", new CommandInfo("setValue", "heater", true) },
            { @"(tắt)\s+.*(máy sưởi|lò sưởi)", new CommandInfo("setValue", "heater", false) },
            { @"(bật|mở)\s+.*(tv|tivi|ti vi|truyền hình)", new CommandInfo("setValue", "tv", true) },
            { @"(tắt)\s+.*(tv|tivi|ti vi|truyền hình)", new CommandInfo("setValue", "tv", false) },
            { @"(mở)\s+.*(rèm|màn cửa)", new CommandInfo("setValue", "curtain", true) },
            { @"(đóng)\s+.*(rèm|màn cửa)", new CommandInfo("setValue", "curtain", false) },
            { @"(phát|bật)\s+nhạc", new CommandInfo("setValue", "music", true) },
            { @"(dừng|tắt)\s+nhạc", new CommandInfo("setValue", "music", false) },
            { @"đặt\s+nhiệt\s+độ\s+(\d+)", new CommandInfo("setTemperature", "thermostat", true, "temperature") },
            { @"tăng\s+âm\s+lượng", new CommandInfo("adjustValue", "speaker", true) },
            { @"giảm\s+âm\s+lượng", new CommandInfo("adjustValue", "speaker", false) },
            { @"khóa\s+.*(cửa)", new CommandInfo("setValue", "door", true) },
            { @"mở\s+khóa\s+.*(cửa)", new CommandInfo("setValue", "door", false) }
        };
        private static readonly Dictionary<string, Dictionary<string, string>> _knowledgeBase = new Dictionary<string, Dictionary<string, string>>
        {
            {
                "en", new Dictionary<string, string>
                {
                    { "capital of vietnam", "The capital of Vietnam is Hanoi." },
                    { "capital of usa", "The capital of the USA is Washington, D.C." },
                    { "tallest mountain", "Mount Everest is the tallest mountain in the world, with a height of 8,848.86 meters (29,031.7 feet)." },
                    { "largest ocean", "The Pacific Ocean is the largest and deepest ocean on Earth." },
                    { "distance earth to moon", "The average distance from Earth to the Moon is about 384,400 kilometers (238,855 miles)." },
                    { "water boiling point", "Water boils at 100 degrees Celsius (212 degrees Fahrenheit) at standard atmospheric pressure." },
                    { "human body temperature", "The normal human body temperature is around 37 degrees Celsius (98.6 degrees Fahrenheit)." }
                }
            },
            {
                "vi", new Dictionary<string, string>
                {
                    { "thủ đô việt nam", "Thủ đô của Việt Nam là Hà Nội." },
                    { "thủ đô mỹ", "Thủ đô của Hoa Kỳ là Washington, D.C." },
                    { "núi cao nhất", "Núi Everest là ngọn núi cao nhất thế giới, với chiều cao 8.848,86 mét (29.031,7 feet)." },
                    { "đại dương lớn nhất", "Thái Bình Dương là đại dương lớn nhất và sâu nhất trên Trái Đất." },
                    { "khoảng cách trái đất đến mặt trăng", "Khoảng cách trung bình từ Trái Đất đến Mặt Trăng là khoảng 384.400 kilomét (238.855 dặm)." },
                    { "nhiệt độ sôi của nước", "Nước sôi ở 100 độ C (212 độ F) ở áp suất khí quyển tiêu chuẩn." },
                    { "nhiệt độ cơ thể người", "Nhiệt độ cơ thể người bình thường là khoảng 37 độ C (98,6 độ F)." }
                }
            }
        };

        private readonly Dictionary<string, List<ChatMessage>> _sessionHistory = new Dictionary<string, List<ChatMessage>>();

        public VoiceAIController(
            ILogger<VoiceAIController> logger,
            IConfiguration configuration,
            MongoDbService mongoDbService)
        {
            _logger = logger;
            _configuration = configuration;
            _mongoDbService = mongoDbService;
            _httpClient = new HttpClient();
            
            _aiServiceUrl = _configuration["AIServices:BaseUrl"] ?? "http://localhost:8000";
            
            _useLocalFallback = _configuration.GetValue<bool>("AIServices:UseLocalFallback", true);
        }

        [HttpPost("interpret")]
        public async Task<IActionResult> InterpretVoiceCommand([FromBody] VoiceCommandRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Command))
                {
                    return BadRequest(new { message = "Voice command cannot be empty" });
                }

                _logger.LogInformation("Received voice command: {Command}", request.Command);

                try 
                {
                    if (!_useLocalFallback) 
                    {
                        var aiResponse = await CallRemoteVoiceInterpreter(request.Command);
                        return Ok(aiResponse);
                    }
                    
                    var timeoutTask = Task.Delay(3000); 
                    var serviceTask = CallRemoteVoiceInterpreter(request.Command);
                    
                    var completedTask = await Task.WhenAny(serviceTask, timeoutTask);
                    if (completedTask == serviceTask && serviceTask.IsCompletedSuccessfully)
                    {
                        return Ok(await serviceTask);
                    }
                    
                    _logger.LogWarning("Remote AI service unavailable or timed out, using local fallback for voice interpretation");
                    
                }
                catch (Exception serviceEx)
                {
                    _logger.LogWarning(serviceEx, "Error calling remote AI service, using local fallback for voice interpretation");
                }
                
                return Ok(ProcessLocalVoiceCommand(request.Command));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error interpreting voice command");
                return StatusCode(500, new { message = "Error interpreting voice command", error = ex.Message });
            }
        }
        
        private async Task<VoiceCommandResponse> CallRemoteVoiceInterpreter(string command)
        {
            var aiRequest = new
            {
                command = command
            };

            var content = new StringContent(
                JsonSerializer.Serialize(aiRequest),
                Encoding.UTF8,
                "application/json");

            var response = await _httpClient.PostAsync($"{_aiServiceUrl}/api/voice/interpret", content);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Error from AI service: {StatusCode}", response.StatusCode);
                throw new HttpRequestException($"AI service returned status code {response.StatusCode}");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<VoiceCommandResponse>(
                responseContent,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        
        private VoiceCommandResponse ProcessLocalVoiceCommand(string command)
        {
            var commandPayload = ProcessLocalCommand(command);
            
            if (commandPayload != null)
            {
                return new VoiceCommandResponse
                {
                    Status = "OK",
                    Payload = commandPayload,
                    Message = DetectLanguage(command) == "vi" 
                        ? "Lệnh đã được nhận diện và xử lý bằng bộ thông dịch cục bộ" 
                        : "Command recognized and processed using local interpreter"
                };
            }
            
            return new VoiceCommandResponse
            {
                Status = "UNRECOGNIZED",
                Payload = null,
                Message = DetectLanguage(command) == "vi" 
                    ? "Lệnh không được nhận diện bởi bộ thông dịch cục bộ" 
                    : "Command not recognized by local interpreter"
            };
        }

        [HttpPost("chat")]
        public async Task<IActionResult> ChatWithAI([FromBody] VoiceChatRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Message))
                {
                    return BadRequest(new { message = "Message cannot be empty" });
                }

                _logger.LogInformation("Received AI chat message: {Message}", request.Message);
                
                string sessionId = request.SessionId ?? Guid.NewGuid().ToString();
                
                StoreMessage(sessionId, "user", request.Message);
                
                try 
                {
                    if (!_useLocalFallback) 
                    {
                        var aiResponse = await CallRemoteAIService(request.Message, sessionId);
                        StoreMessage(sessionId, "assistant", aiResponse.Response);
                        return Ok(aiResponse);
                    }
                    
                    var timeoutTask = Task.Delay(3000); 
                    var serviceTask = CallRemoteAIService(request.Message, sessionId);
                    
                    var completedTask = await Task.WhenAny(serviceTask, timeoutTask);
                    if (completedTask == serviceTask && serviceTask.IsCompletedSuccessfully)
                    {
                        var response = await serviceTask;
                        StoreMessage(sessionId, "assistant", response.Response);
                        return Ok(response);
                    }
                    
                    _logger.LogWarning("Remote AI service unavailable or timed out, using local fallback");
                    
                }
                catch (Exception serviceEx)
                {
                    _logger.LogWarning(serviceEx, "Error calling remote AI service, using local fallback");
                }
                
                var fallbackResponse = ProcessLocalFallback(request.Message, sessionId);
                StoreMessage(sessionId, "assistant", fallbackResponse.Response);
                return Ok(fallbackResponse);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing AI chat");
                return StatusCode(500, new { message = "Error processing AI chat", error = ex.Message });
            }
        }
        
        private async Task<AIChatResponse> CallRemoteAIService(string message, string sessionId)
        {
            var history = GetSessionHistory(sessionId);
            
            var aiRequest = new
            {
                message = message,
                sessionId = sessionId,
                history = history
            };

            var content = new StringContent(
                JsonSerializer.Serialize(aiRequest),
                Encoding.UTF8,
                "application/json");

            var response = await _httpClient.PostAsync($"{_aiServiceUrl}/api/chat", content);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Error from AI chat service: {StatusCode}", response.StatusCode);
                throw new HttpRequestException($"AI service returned status code {response.StatusCode}");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<AIChatResponse>(
                responseContent,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        
        private AIChatResponse ProcessLocalFallback(string message, string sessionId)
        {
            string language = DetectLanguage(message);
            
            var commandResult = ProcessLocalCommand(message);
            if (commandResult != null)
            {
                string responses = language == "vi" 
                    ? "Tôi sẽ thực hiện lệnh đó cho bạn."
                    : "I'll execute that command for you.";
                    
                return new AIChatResponse
                {
                    Response = responses,
                    SessionId = sessionId,
                    IsCommand = true,
                    CommandPayload = new 
                    {
                        Status = "OK",
                        Payload = commandResult
                    }
                };
            }
            
            string knowledgeResponse = CheckKnowledgeBase(message, language);
            if (!string.IsNullOrEmpty(knowledgeResponse))
            {
                return new AIChatResponse
                {
                    Response = knowledgeResponse,
                    SessionId = sessionId,
                    IsCommand = false
                };
            }
            
            string contextResponse = GenerateContextualResponse(message, sessionId, language);
            if (!string.IsNullOrEmpty(contextResponse))
            {
                return new AIChatResponse
                {
                    Response = contextResponse,
                    SessionId = sessionId,
                    IsCommand = false
                };
            }
            
            string response = GetLocalChatResponse(message, language);
            
            return new AIChatResponse
            {
                Response = response,
                SessionId = sessionId,
                IsCommand = false
            };
        }
        
        private object ProcessLocalCommand(string message)
        {
            string language = DetectLanguage(message);
            var commandPatterns = language == "vi" ? _commandPatternsVi : _commandPatternsEn;
            
            string lowerMessage = message.ToLower();
            
            foreach (var pattern in commandPatterns)
            {
                var match = Regex.Match(lowerMessage, pattern.Key, RegexOptions.IgnoreCase);
                if (match.Success)
                {
                    var commandInfo = pattern.Value;
                    
                    if (!string.IsNullOrEmpty(commandInfo.ParameterName) && match.Groups.Count > 1)
                    {
                        if (int.TryParse(match.Groups[1].Value, out int paramValue))
                        {
                            return new
                            {
                                method = commandInfo.Method,
                                @params = new Dictionary<string, object>
                                {
                                    { commandInfo.Device, commandInfo.Value },
                                    { commandInfo.ParameterName, paramValue }
                                }
                            };
                        }
                    }
                    
                    return new
                    {
                        method = commandInfo.Method,
                        @params = new Dictionary<string, bool>
                        {
                            { commandInfo.Device, commandInfo.Value }
                        }
                    };
                }
            }
            
            return null;
        }
        
        private string GetLocalChatResponse(string message, string language)
        {
            var responseDict = language == "vi" ? _fallbackResponsesVi : _fallbackResponsesEn;
            string lowerMessage = message.ToLower();
            
            foreach (var response in responseDict)
            {
                if (lowerMessage.Contains(response.Key))
                {
                    return response.Value;
                }
            }
            
            // Default response if no match found
            return language == "vi"
                ? "Tôi không chắc tôi hiểu điều đó. Bạn có thể điều khiển thiết bị bằng lệnh như 'bật đèn' hoặc 'tắt quạt'."
                : "I'm not sure I understood that. You can control your devices with commands like 'turn on the light' or 'turn off the fan'.";
        }
        
        private string DetectLanguage(string text)
        {
            string lowerText = text.ToLower();
            
            if (lowerText.Contains("ă") || lowerText.Contains("â") || lowerText.Contains("đ") || 
                lowerText.Contains("ê") || lowerText.Contains("ô") || lowerText.Contains("ơ") || 
                lowerText.Contains("ư") || lowerText.Contains("á") || lowerText.Contains("à") ||
                lowerText.Contains("ả") || lowerText.Contains("ã") || lowerText.Contains("ạ"))
            {
                return "vi";
            }
            
            string[] viWords = { "xin chào", "cảm ơn", "tạm biệt", "bạn", "tôi", "không", "có", "và", "hoặc", "nhưng" };
            foreach (var word in viWords)
            {
                if (lowerText.Contains(word))
                {
                    return "vi";
                }
            }
            
            return "en";
        }
        
        private string CheckKnowledgeBase(string message, string language)
        {
            if (!_knowledgeBase.TryGetValue(language, out var knowledgeDict))
            {
                return null;
            }
            
            string lowerMessage = message.ToLower();
            
            foreach (var entry in knowledgeDict)
            {
                if (lowerMessage.Contains(entry.Key))
                {
                    return entry.Value;
                }
            }
            
            return null;
        }
        
        private void StoreMessage(string sessionId, string role, string content)
        {
            if (!_sessionHistory.ContainsKey(sessionId))
            {
                _sessionHistory[sessionId] = new List<ChatMessage>();
            }
            
            _sessionHistory[sessionId].Add(new ChatMessage
            {
                Role = role,
                Content = content,
                Timestamp = DateTime.UtcNow
            });
            
            if (_sessionHistory[sessionId].Count > 10)
            {
                _sessionHistory[sessionId].RemoveAt(0);
            }
        }
        
        private List<ChatMessage> GetSessionHistory(string sessionId)
        {
            if (_sessionHistory.TryGetValue(sessionId, out var history))
            {
                return history;
            }
            
            return new List<ChatMessage>();
        }
        
        private string GenerateContextualResponse(string message, string sessionId, string language)
        {
            var history = GetSessionHistory(sessionId);
            if (history.Count < 1)
            {
                return null;
            }
            
            string lowerMessage = message.ToLower();
            
            bool isFollowUp = language == "vi" 
                ? (lowerMessage.Contains("tại sao") || lowerMessage.Contains("vì sao") || lowerMessage.Contains("thế nào") || 
                   lowerMessage.Contains("cái đó") || lowerMessage.Contains("điều đó") || lowerMessage.StartsWith("và"))
                : (lowerMessage.Contains("why") || lowerMessage.Contains("how come") || lowerMessage.Contains("how is that") || 
                   lowerMessage.StartsWith("and") || lowerMessage.StartsWith("but") || lowerMessage.Contains("that"));
            
            if (!isFollowUp)
            {
                return null;
            }
            
            var lastAssistantMsg = history
                .Where(m => m.Role == "assistant")
                .LastOrDefault();
                
            if (lastAssistantMsg == null)
            {
                return null;
            }
            
            if (language == "vi")
            {
                if (lastAssistantMsg.Content.Contains("nhiệt độ"))
                {
                    return "Nhiệt độ thay đổi dựa trên hệ thống điều hòa và các cài đặt của bạn. Bạn có muốn tôi điều chỉnh nó không?";
                }
                else if (lastAssistantMsg.Content.Contains("đèn") || lastAssistantMsg.Content.Contains("ánh sáng"))
                {
                    return "Hệ thống đèn được kết nối qua mạng Wi-Fi và có thể được điều khiển từ xa. Có thể điều chỉnh độ sáng và màu sắc nếu bạn có đèn thông minh.";
                }
            }
            else 
            {
                if (lastAssistantMsg.Content.Contains("temperature"))
                {
                    return "Temperature changes are based on your HVAC system and its settings. Would you like me to adjust it for you?";
                }
                else if (lastAssistantMsg.Content.Contains("light"))
                {
                    return "The lighting system is connected via Wi-Fi and can be remotely controlled. Brightness and color can be adjusted if you have smart bulbs.";
                }
            }
            
            return null;
        }
    }

    internal class ChatMessage
    {
        public string Content { get; internal set; }
        public string Role { get; internal set; }
        public DateTime Timestamp { get; internal set; }
    }

    public class VoiceCommandRequest
    {
        public string Command { get; set; }
    }

    public class VoiceCommandResponse
    {
        public string Status { get; set; }
        public object Payload { get; set; }
        public string Message { get; set; }
    }

    public class VoiceChatRequest
    {
        public string Message { get; set; }
        public string SessionId { get; set; }
    }

    public class AIChatResponse
    {
        public string Response { get; set; }
        public string SessionId { get; set; }
        public bool IsCommand { get; set; }
        public object CommandPayload { get; set; }
    }
    
    public class CommandInfo
    {
        private string v;

        public string Method { get; }
        public string Device { get; }
        public bool Value { get; }
        public string? ParameterName { get; internal set; }

        public CommandInfo(string method, string device, bool value)
        {
            Method = method;
            Device = device;
            Value = value;
        }

        public CommandInfo(string method, string device, bool value, string v) : this(method, device, value)
        {
            this.v = v;
        }
    }
}
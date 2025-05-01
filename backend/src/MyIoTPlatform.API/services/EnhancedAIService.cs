using System.Text.RegularExpressions;

namespace MyIoTPlatform.API.Services
{
    public class EnhancedAIService
    {
        private readonly ILogger<EnhancedAIService> _logger;
        private readonly MongoDbService _mongoDbService;
    
        private static readonly Dictionary<string, Dictionary<string, string>> _extendedKnowledge = new Dictionary<string, Dictionary<string, string>>
        {
            {
                "en", new Dictionary<string, string>
                {
                    { "smart home", "A smart home is a residence that uses internet-connected devices to enable remote monitoring and management of appliances and systems." },
                    { "iot", "IoT (Internet of Things) refers to the network of physical objects embedded with sensors, software, and connectivity to exchange data with other devices and systems over the internet." },
                    { "voice assistant", "A voice assistant is a digital assistant that uses voice recognition, natural language processing, and AI to provide services through devices." },
                    { "smart light", "Smart lights are connected lighting systems that can be controlled remotely, automated with schedules, or respond to other smart home triggers." },
                    { "smart thermostat", "A smart thermostat is a Wi-Fi enabled device that automatically adjusts your home's temperature settings for optimal performance." },
                    { "automation", "Home automation is the automatic control of electronic devices in your home, creating automated routines based on time, sensor detection, or other triggers." },
                    { "energy saving", "Smart home systems can help save energy by optimizing heating, cooling, and lighting based on occupancy and usage patterns." }
                }
            },
            {
                "vi", new Dictionary<string, string>
                {
                    { "nhà thông minh", "Nhà thông minh là nơi cư trú sử dụng các thiết bị kết nối internet để cho phép giám sát và quản lý từ xa các thiết bị và hệ thống." },
                    { "iot", "IoT (Internet of Things - Internet vạn vật) đề cập đến mạng lưới các vật thể vật lý được tích hợp cảm biến, phần mềm và khả năng kết nối để trao đổi dữ liệu với các thiết bị và hệ thống khác qua internet." },
                    { "trợ lý giọng nói", "Trợ lý giọng nói là trợ lý kỹ thuật số sử dụng nhận dạng giọng nói, xử lý ngôn ngữ tự nhiên và trí tuệ nhân tạo để cung cấp dịch vụ thông qua các thiết bị." },
                    { "đèn thông minh", "Đèn thông minh là hệ thống chiếu sáng kết nối có thể được điều khiển từ xa, tự động hóa theo lịch trình hoặc phản ứng với các kích hoạt nhà thông minh khác." },
                    { "bộ điều nhiệt thông minh", "Bộ điều nhiệt thông minh là thiết bị có kết nối Wi-Fi tự động điều chỉnh cài đặt nhiệt độ trong nhà của bạn để đạt hiệu suất tối ưu." },
                    { "tự động hóa", "Tự động hóa nhà là việc kiểm soát tự động các thiết bị điện tử trong nhà bạn, tạo ra các quy trình tự động dựa trên thời gian, phát hiện cảm biến hoặc các kích hoạt khác." },
                    { "tiết kiệm năng lượng", "Hệ thống nhà thông minh có thể giúp tiết kiệm năng lượng bằng cách tối ưu hóa hệ thống sưởi, làm mát và chiếu sáng dựa trên mức độ chiếm dụng và mô hình sử dụng." }
                }
            }
        };
        

        private static readonly Dictionary<string, HashSet<string>> _functionWords = new Dictionary<string, HashSet<string>>
        {
            { 
                "vi", new HashSet<string> { 
                    "và", "hoặc", "nhưng", "vì", "nếu", "khi", "để", "của", "trong", "ngoài", 
                    "trên", "dưới", "với", "cùng", "là", "có", "không", "đã", "sẽ", "đang",
                    "rằng", "mà", "thì", "những", "các", "bởi", "tại", "từ", "tới", "về" 
                } 
            },
            { 
                "en", new HashSet<string> { 
                    "and", "or", "but", "because", "if", "when", "to", "of", "in", "out", 
                    "on", "under", "with", "is", "are", "am", "have", "has", "will", "would",
                    "that", "which", "who", "where", "there", "their", "they", "them", "these", "those" 
                } 
            }
        };

        private static readonly Dictionary<string, Dictionary<string, WeatherResponse>> _weatherResponses = new Dictionary<string, Dictionary<string, WeatherResponse>>
        {
            {
                "en", new Dictionary<string, WeatherResponse>
                {
                    { "sunny", new WeatherResponse("sunny", "It's currently sunny with clear skies.", "sunny") },
                    { "cloudy", new WeatherResponse("cloudy", "It's currently cloudy.", "cloudy") },
                    { "rainy", new WeatherResponse("rainy", "It's currently raining.", "rainy") },
                    { "snowy", new WeatherResponse("snowy", "It's currently snowing.", "snowy") },
                    { "stormy", new WeatherResponse("stormy", "There's currently a storm in the area.", "stormy") }
                }
            },
            {
                "vi", new Dictionary<string, WeatherResponse>
                {
                    { "nắng", new WeatherResponse("nắng", "Hiện tại trời đang nắng với bầu trời trong xanh.", "sunny") },
                    { "nhiều mây", new WeatherResponse("nhiều mây", "Hiện tại trời nhiều mây.", "cloudy") },
                    { "mưa", new WeatherResponse("mưa", "Hiện tại trời đang mưa.", "rainy") },
                    { "tuyết", new WeatherResponse("tuyết", "Hiện tại trời đang có tuyết rơi.", "snowy") },
                    { "bão", new WeatherResponse("bão", "Hiện tại đang có bão trong khu vực.", "stormy") }
                }
            }
        };

        public EnhancedAIService(ILogger<EnhancedAIService> logger, MongoDbService mongoDbService)
        {
            _logger = logger;
            _mongoDbService = mongoDbService;
        }
        
        public string GetEnhancedResponse(string message, List<ChatMessage> history, string language)
        {
            if (language == null)
            {
                language = DetectLanguageAdvanced(message);
            }
            
            if (IsWeatherQuery(message, language))
            {
                return GenerateWeatherResponse(message, language);
            }
            
            if (IsHomeStatusQuery(message, language))
            {
                return GetHomeStatus(language);
            }
            
            string knowledgeResponse = CheckExtendedKnowledge(message, language);
            if (!string.IsNullOrEmpty(knowledgeResponse))
            {
                return knowledgeResponse;
            }
            
            string contextualResponse = GenerateContextualResponse(message, history, language);
            if (!string.IsNullOrEmpty(contextualResponse))
            {
                return contextualResponse;
            }
            
            return language == "vi"
                ? "Tôi không có đủ thông tin để trả lời câu hỏi đó. Bạn có thể hỏi về tình trạng thiết bị, thời tiết, hoặc điều khiển các thiết bị trong nhà."
                : "I don't have enough information to answer that question. You can ask about device status, weather, or control your home devices.";
        }
        
        private string DetectLanguageAdvanced(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return "en";
            }
            
            string lowerText = text.ToLower();
            if (lowerText.Contains("ă") || lowerText.Contains("â") || lowerText.Contains("đ") || 
                lowerText.Contains("ê") || lowerText.Contains("ô") || lowerText.Contains("ơ") || 
                lowerText.Contains("ư") || lowerText.Contains("á") || lowerText.Contains("à") ||
                lowerText.Contains("ả") || lowerText.Contains("ã") || lowerText.Contains("ạ"))
            {
                return "vi";
            }
            int viCount = 0;
            int enCount = 0;
            string[] words = Regex.Split(lowerText, @"\W+");
            
            foreach (string word in words)
            {
                if (_functionWords["vi"].Contains(word))
                {
                    viCount++;
                }
                if (_functionWords["en"].Contains(word))
                {
                    enCount++;
                }
            }
            if (viCount > enCount)
            {
                return "vi";
            }
            
            return "en"; 
        }
        
        private bool IsWeatherQuery(string message, string language)
        {
            string lowerMessage = message.ToLower();
            
            if (language == "vi")
            {
                return lowerMessage.Contains("thời tiết") || 
                       lowerMessage.Contains("trời") || 
                       lowerMessage.Contains("nhiệt độ ngoài") || 
                       lowerMessage.Contains("dự báo") ||
                       lowerMessage.Contains("nắng") ||
                       lowerMessage.Contains("mưa");
            }
            else
            {
                return lowerMessage.Contains("weather") || 
                       lowerMessage.Contains("temperature outside") || 
                       lowerMessage.Contains("forecast") ||
                       lowerMessage.Contains("sunny") ||
                       lowerMessage.Contains("rainy");
            }
        }
        
        private string GenerateWeatherResponse(string message, string language)
        {
            Random rnd = new Random();
            
            var weatherDict = _weatherResponses[language];
            var weatherKeys = weatherDict.Keys.ToList();
            string weatherType = weatherKeys[rnd.Next(weatherKeys.Count)];
            
            var weather = weatherDict[weatherType];
            
            if (language == "vi")
            {
                return $"Hiện tại trời đang {weather.Condition}. {weather.Description} Nhiệt độ khoảng {rnd.Next(15, 35)}°C.";
            }
            else
            {
                return $"It's currently {weather.Condition}. {weather.Description} The temperature is around {rnd.Next(59, 95)}°F.";
            }
        }
        
        private bool IsHomeStatusQuery(string message, string language)
        {
            string lowerMessage = message.ToLower();
            
            if (language == "vi")
            {
                return lowerMessage.Contains("tình trạng nhà") || 
                       lowerMessage.Contains("trạng thái thiết bị") || 
                       lowerMessage.Contains("thiết bị nào đang") ||
                       (lowerMessage.Contains("kiểm tra") && (lowerMessage.Contains("thiết bị") || lowerMessage.Contains("nhà")));
            }
            else
            {
                return lowerMessage.Contains("home status") || 
                       lowerMessage.Contains("device status") || 
                       lowerMessage.Contains("which devices are") ||
                       (lowerMessage.Contains("check") && (lowerMessage.Contains("device") || lowerMessage.Contains("home")));
            }
        }
        
        private string GetHomeStatus(string language)
        {
            
            if (language == "vi")
            {
                return "Nhà bạn đang an toàn. Nhiệt độ trong nhà là 24°C. Đèn phòng khách đang bật. Cửa chính đã khóa. Điều hòa phòng ngủ đang tắt.";
            }
            else
            {
                return "Your home is secure. Indoor temperature is 75°F. Living room lights are on. Front door is locked. Bedroom air conditioning is off.";
            }
        }
        
        private string CheckExtendedKnowledge(string message, string language)
        {
            if (!_extendedKnowledge.TryGetValue(language, out var knowledgeDict))
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
        
        private string GenerateContextualResponse(string message, List<ChatMessage> history, string language)
        {
            if (history == null || history.Count < 2)
            {
                return null;
            }
            
            string lowerMessage = message.ToLower();
            var lastUserMsg = history
                .Where(m => m.Role == "user")
                .LastOrDefault();
                
            var lastAssistantMsg = history
                .Where(m => m.Role == "assistant")
                .LastOrDefault();
                
            if (lastUserMsg == null || lastAssistantMsg == null)
            {
                return null;
            }
            if (language == "vi")
            {
                if ((lowerMessage.Contains("tại sao") || lowerMessage.Contains("vì sao")) && 
                    (lastAssistantMsg.Content.Contains("đèn") || lastAssistantMsg.Content.Contains("ánh sáng")))
                {
                    return "Hệ thống đèn hoạt động thông qua kết nối Wi-Fi và được điều khiển bằng bộ điều khiển trung tâm. Bạn có thể tự động hóa chúng hoặc điều khiển chúng bằng giọng nói.";
                }
                
                if (lowerMessage.Contains("làm thế nào") && lastAssistantMsg.Content.Contains("nhiệt độ"))
                {
                    return "Nhiệt độ được điều chỉnh thông qua bộ điều nhiệt thông minh, kết nối với hệ thống HVAC của bạn. Nó có thể tự động điều chỉnh dựa trên sở thích của bạn và thời gian trong ngày.";
                }
            }
            else 
            {
                if ((lowerMessage.Contains("why") || lowerMessage.Contains("how come")) && 
                    lastAssistantMsg.Content.ToLower().Contains("light"))
                {
                    return "The lighting system works through Wi-Fi connectivity and is controlled by a central hub. You can automate them or control them with voice commands.";
                }
                
                if (lowerMessage.Contains("how") && lastAssistantMsg.Content.ToLower().Contains("temperature"))
                {
                    return "Temperature is adjusted through a smart thermostat, connected to your HVAC system. It can automatically adjust based on your preferences and time of day.";
                }
            }
            
            return null;
        }
    }

    public class ChatMessage
{
    public string Role { get; set; } 
    public string Content { get; set; } 
    
    public ChatMessage(string role, string content)
    {
        Role = role;
        Content = content;
    }
    
    public ChatMessage() { }
}

    public class WeatherResponse
    {
        public string Condition { get; set; }
        public string Description { get; set; }
        public string Icon { get; set; }
        
        public WeatherResponse(string condition, string description, string icon)
        {
            Condition = condition;
            Description = description;
            Icon = icon;
        }
    }
}
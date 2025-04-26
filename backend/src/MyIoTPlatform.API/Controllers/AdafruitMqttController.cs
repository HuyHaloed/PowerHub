using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyIoTPlatform.Application.Interfaces.Communication;
using System;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace MyIoTPlatform.API.Controllers
{
    [ApiController]
    [Route("api/adafruit")]
    [Authorize]
    public class AdafruitMqttController : ControllerBase
    {
        private readonly IMqttClientService _adafruitMqttService;
        private readonly ILogger<AdafruitMqttController> _logger;
        private readonly IConfiguration _configuration;

        public AdafruitMqttController(
        IMqttClientService adafruitMqttService, 
        ILogger<AdafruitMqttController> logger,
        IConfiguration configuration) // Thêm vào constructor
    {
        _adafruitMqttService = adafruitMqttService;
        _logger = logger;
        _configuration = configuration; // Gán giá trị
    }

        [HttpPost("publish")]
        public async Task<IActionResult> PublishToFeed([FromBody] AdafruitPublishRequest request)
        {
            if (string.IsNullOrEmpty(request.Feed) || string.IsNullOrEmpty(request.Payload))
            {
                return BadRequest("Feed and payload are required");
            }

            try
            {
                await _adafruitMqttService.PublishAsync(request.Feed, request.Payload, request.Retain, request.QosLevel);
                return Ok(new { message = $"Message published to feed '{request.Feed}' successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error publishing to Adafruit feed '{request.Feed}'");
                return StatusCode(500, new { message = $"Error: {ex.Message}" });
            }
        }

        [HttpPost("subscribe")]
        public async Task<IActionResult> SubscribeToFeed([FromBody] AdafruitSubscribeRequest request)
        {
            if (string.IsNullOrEmpty(request.Feed))
            {
                return BadRequest("Feed name is required");
            }

            try
            {
                await _adafruitMqttService.SubscribeAsync(request.Feed);
                return Ok(new { message = $"Subscribed to feed '{request.Feed}' successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error subscribing to Adafruit feed '{request.Feed}'");
                return StatusCode(500, new { message = $"Error: {ex.Message}" });
            }
        }

        [HttpPost("unsubscribe")]
        public async Task<IActionResult> UnsubscribeFromFeed([FromBody] AdafruitUnsubscribeRequest request)
        {
            if (string.IsNullOrEmpty(request.Feed))
            {
                return BadRequest("Feed name is required");
            }

            try
            {
                await _adafruitMqttService.UnsubscribeAsync(request.Feed);
                return Ok(new { message = $"Unsubscribed from feed '{request.Feed}' successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error unsubscribing from Adafruit feed '{request.Feed}'");
                return StatusCode(500, new { message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet("data/{feed}")]
        public async Task<IActionResult> GetFeedData(string feed)
        {
            if (string.IsNullOrEmpty(feed))
            {
                return BadRequest("Feed name is required");
            }

            try
            {
                // Gọi đến Adafruit API để lấy giá trị mới nhất của feed
                // Đây là một ví dụ, bạn cần thay thế bằng cách gọi thực tế đến Adafruit API
                var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("X-AIO-Key", _configuration["Adafruit:IoKey"]);
                
                var response = await httpClient.GetAsync($"https://io.adafruit.com/api/v2/{_configuration["Adafruit:Username"]}/feeds/{feed}/data/last");
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var data = System.Text.Json.JsonSerializer.Deserialize<AdafruitDataResponse>(content);
                    
                    return Ok(new { value = data.Value, created_at = data.CreatedAt });
                }
                else
                {
                    return StatusCode((int)response.StatusCode, new { message = $"Error fetching data from Adafruit: {response.ReasonPhrase}" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting data from Adafruit feed '{feed}'");
                return StatusCode(500, new { message = $"Error: {ex.Message}" });
            }
        }
    }

    public class AdafruitPublishRequest
    {
        /// <summary>
        /// The Adafruit IO feed name
        /// </summary>
        public string Feed { get; set; }
        
        /// <summary>
        /// The message payload to publish
        /// </summary>
        public string Payload { get; set; }
        
        /// <summary>
        /// Whether to retain the message on the broker
        /// </summary>
        public bool Retain { get; set; } = false;
        
        /// <summary>
        /// Quality of Service level (0, 1, or 2)
        /// </summary>
        public int QosLevel { get; set; } = 1;
    }

    public class AdafruitSubscribeRequest
    {
        /// <summary>
        /// The Adafruit IO feed name to subscribe to
        /// </summary>
        public string Feed { get; set; }
        
        /// <summary>
        /// Quality of Service level (0, 1, or 2)
        /// </summary>
        public int QosLevel { get; set; } = 1;
    }

    public class AdafruitUnsubscribeRequest
    {
        /// <summary>
        /// The Adafruit IO feed name to unsubscribe from
        /// </summary>
        public string Feed { get; set; }
    }

    public class AdafruitDataResponse
    {
        [JsonPropertyName("value")]
        public string Value { get; set; }
        
        [JsonPropertyName("created_at")]
        public string CreatedAt { get; set; }
    }
}
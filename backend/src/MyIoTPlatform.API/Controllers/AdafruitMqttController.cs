using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyIoTPlatform.Application.Interfaces.Communication;
using System;
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

        public AdafruitMqttController(IMqttClientService adafruitMqttService, ILogger<AdafruitMqttController> logger)
        {
            _adafruitMqttService = adafruitMqttService;
            _logger = logger;
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
}
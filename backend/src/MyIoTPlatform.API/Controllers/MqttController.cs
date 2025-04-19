using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyIoTPlatform.Application.Interfaces.Communication;

namespace MyIoTPlatform.API.Controllers
{
    [ApiController]
    [Route("api/mqtt")]
    [Authorize]
    public class MqttController : ControllerBase
    {
        private readonly IMqttClientService _mqttClientService;

        public MqttController(IMqttClientService mqttClientService)
        {
            _mqttClientService = mqttClientService;
        }

        [HttpPost("publish")]
        public async Task<IActionResult> PublishMessage([FromBody] PublishMessageRequest request)
        {
            await _mqttClientService.PublishAsync(request.Topic, request.Payload, request.Retain, request.QosLevel);
            return Ok(new { message = "MQTT message published successfully." });
        }
    }

    public class PublishMessageRequest
    {
        public string Topic { get; set; }
        public string Payload { get; set; }
        public bool Retain { get; set; }
        public int QosLevel { get; set; }
    }
}
using System.Threading.Tasks;

namespace MyIoTPlatform.Application.Interfaces.Communication;

public interface IMqttClientService
{
    Task PublishAsync(string topic, string payload, bool retain, int qosLevel);
    Task SubscribeAsync(string topic);
}
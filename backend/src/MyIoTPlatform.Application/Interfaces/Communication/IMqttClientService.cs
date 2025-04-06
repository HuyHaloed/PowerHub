using System.Threading.Tasks;

namespace MyIoTPlatform.Application.Interfaces.Communication;

public interface IMqttClientService
{
    Task PublishAsync(string topic, string payload);
    Task SubscribeAsync(string topic);
    //..
}
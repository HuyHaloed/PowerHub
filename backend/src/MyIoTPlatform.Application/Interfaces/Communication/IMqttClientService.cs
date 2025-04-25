using System.Threading.Tasks;

namespace MyIoTPlatform.Application.Interfaces.Communication
{
    public interface IMqttClientService
    {
        /// <summary>
        /// Publishes a message to the specified topic
        /// </summary>
        /// <param name="topic">The topic to publish to</param>
        /// <param name="payload">The message payload</param>
        /// <param name="retain">Whether to retain the message on the broker</param>
        /// <param name="qosLevel">Quality of Service level (0, 1, or 2)</param>
        Task PublishAsync(string topic, string payload, bool retain = false, int qosLevel = 1);

        /// <summary>
        /// Subscribes to the specified topic
        /// </summary>
        /// <param name="topic">The topic to subscribe to</param>
        Task SubscribeAsync(string topic);

        /// <summary>
        /// Unsubscribes from the specified topic
        /// </summary>
        /// <param name="topic">The topic to unsubscribe from</param>
        Task UnsubscribeAsync(string topic);
    }
}
namespace MyIoTPlatform.Infrastructure.Communication.Adafruit
{
    public class AdafruitMqttConfig
    {
        /// <summary>
        /// Adafruit username
        /// </summary>
        public string Username { get; set; }

        /// <summary>
        /// Adafruit IO Key
        /// </summary>
        public string IoKey { get; set; }

        /// <summary>
        /// Broker URL (default: io.adafruit.com)
        /// </summary>
        public string BrokerUrl { get; set; } = "io.adafruit.com";

        /// <summary>
        /// Broker port (default: 8883 for TLS)
        /// </summary>
        public int Port { get; set; } = 8883;

        /// <summary>
        /// Whether to use TLS/SSL (recommended)
        /// </summary>
        public bool UseTls { get; set; } = true;

        /// <summary>
        /// Client ID prefix (will be appended with a GUID)
        /// </summary>
        public string ClientIdPrefix { get; set; } = "MyIoTPlatform_";

        /// <summary>
        /// Connection timeout in seconds
        /// </summary>
        public int ConnectionTimeoutSeconds { get; set; } = 30;

        /// <summary>
        /// Keep alive interval in seconds
        /// </summary>
        public int KeepAliveSeconds { get; set; } = 60;

        /// <summary>
        /// Reconnect delay in seconds
        /// </summary>
        public int ReconnectDelaySeconds { get; set; } = 5;
    }
}
namespace MyIoTPlatform.Domain.Exceptions
{
    public class InvalidRuleConfigurationException : DomainException
    {
        public InvalidRuleConfigurationException(string message) : base($"Invalid rule configuration: {message}")
        {
        }
    }
}
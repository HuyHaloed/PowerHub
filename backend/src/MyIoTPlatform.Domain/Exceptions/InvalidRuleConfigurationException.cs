using MyIoTPlatform.Domain.Common;

namespace MyIoTPlatform.Domain.Exceptions
{
    /// <summary>
    /// Exception thrown when a rule configuration is invalid.
    /// </summary>
    /// <param name="message">A detailed message describing the invalid configuration.</param>
    /// <example>
    /// throw new InvalidRuleConfigurationException("Rule condition is missing.");
    /// </example>
    public class InvalidRuleConfigurationException : DomainException
    {
        public InvalidRuleConfigurationException(string message) : base($"Invalid rule configuration: {message}")
        {
        }
    }
}
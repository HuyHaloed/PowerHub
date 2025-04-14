using MyIoTPlatform.Domain.Common;
namespace MyIoTPlatform.Domain.Exceptions
{
    /// <summary>
    /// Exception thrown when a rule is not found.
    /// </summary>
    /// <param name="ruleId">The unique identifier of the rule that was not found.</param>
    /// <example>
    /// throw new RuleNotFoundException(ruleId);
    /// </example>
    public class RuleNotFoundException : DomainException
    {
        public RuleNotFoundException(Guid ruleId) : base($"Rule with ID '{ruleId}' was not found.")
        {
        }
    }
}
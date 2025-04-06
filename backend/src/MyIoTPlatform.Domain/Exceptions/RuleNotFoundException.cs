using System;

namespace MyIoTPlatform.Domain.Exceptions
{
    public class RuleNotFoundException : DomainException
    {
        public RuleNotFoundException(Guid ruleId) : base($"Rule with ID '{ruleId}' was not found.")
        {
        }
    }
}
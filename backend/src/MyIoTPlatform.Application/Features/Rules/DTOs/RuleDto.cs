namespace MyIoTPlatform.Application.Features.Rules.DTOs
{
    public class RuleDto
    {
        public required string Id { get; set; } // Added required modifier
        public required string Name { get; set; } // Added required modifier
        public required string Condition { get; set; } // Added required modifier
        public required string Action { get; set; } // Added required modifier
    }
}
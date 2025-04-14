using MediatR;

namespace MyIoTPlatform.Application.Features.Rules.Commands
{
    public class CreateRuleCommand : IRequest
    {
        public required string Name { get; set; } // Added required modifier
        public required string Condition { get; set; } // Added required modifier
        public required string Action { get; set; } // Added required modifier
    }
}
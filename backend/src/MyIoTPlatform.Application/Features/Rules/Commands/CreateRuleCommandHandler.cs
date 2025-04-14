using MediatR;
using MyIoTPlatform.Domain.Entities;
using MyIoTPlatform.Domain.Interfaces.Repositories;
using System.Threading;
using System.Threading.Tasks;

namespace MyIoTPlatform.Application.Features.Rules.Commands
{
    public class CreateRuleCommandHandler : IRequestHandler<CreateRuleCommand>
    {
        private readonly IRuleRepository _ruleRepository;

        public CreateRuleCommandHandler(IRuleRepository ruleRepository)
        {
            _ruleRepository = ruleRepository;
        }

        public async Task<Unit> Handle(CreateRuleCommand request, CancellationToken cancellationToken)
        {
            var rule = new Rule
            {
                Name = request.Name,
                Condition = request.Condition,
                Action = request.Action
            };

            await _ruleRepository.AddAsync(rule);

            return Unit.Value;
        }
    }
}
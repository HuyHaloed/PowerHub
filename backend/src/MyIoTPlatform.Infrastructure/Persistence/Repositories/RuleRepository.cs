using MyIoTPlatform.Domain.Entities;
using MyIoTPlatform.Domain.Interfaces.Repositories;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MyIoTPlatform.Infrastructure.Persistence.Repositories
{
    public class RuleRepository : IRuleRepository
    {
        private readonly List<Rule> _rules = new();

        public Task AddAsync(Rule rule)
        {
            _rules.Add(rule);
            return Task.CompletedTask;
        }

        public Task<IEnumerable<Rule>> GetAllAsync()
        {
            return Task.FromResult<IEnumerable<Rule>>(_rules);
        }
    }
}
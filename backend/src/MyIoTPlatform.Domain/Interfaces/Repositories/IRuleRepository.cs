using MyIoTPlatform.Domain.Entities;

namespace MyIoTPlatform.Domain.Interfaces.Repositories
{
    public interface IRuleRepository
    {
        Task AddAsync(Rule rule);
        Task<IEnumerable<Rule>> GetAllAsync();
    }
}
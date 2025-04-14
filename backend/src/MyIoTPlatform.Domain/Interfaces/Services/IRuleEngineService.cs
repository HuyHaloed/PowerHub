using System;
using System.Threading;
using System.Threading.Tasks;
using MyIoTPlatform.Domain.Entities;

namespace MyIoTPlatform.Domain.Interfaces.Services
{
    public interface IRuleEngineService
    {
        Task EvaluateRulesAsync(TelemetryData telemetryData, CancellationToken cancellationToken = default);
        Task AddRuleAsync(Rule rule, CancellationToken cancellationToken = default);
        Task UpdateRuleAsync(Rule rule, CancellationToken cancellationToken = default);
        Task DeleteRuleAsync(Guid ruleId, CancellationToken cancellationToken = default);
    }
}
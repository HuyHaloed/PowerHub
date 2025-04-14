namespace MyIoTPlatform.Domain.Entities;

/// <summary>
/// Represents a rule for evaluating telemetry data.
/// </summary>
public class Rule
{
    /// <summary>
    /// The unique identifier of the rule.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// The name of the rule.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// The condition to evaluate (e.g., a logical expression).
    /// </summary>
    public string Condition { get; set; } = string.Empty;

    /// <summary>
    /// The action to perform if the condition is met.
    /// </summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// The date and time when the rule was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// The date and time when the rule was last updated.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
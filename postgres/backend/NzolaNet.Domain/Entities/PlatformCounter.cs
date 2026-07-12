namespace NzolaNet.Domain.Entities;

/// <summary>
/// Persistent named counter used for platform-wide metrics that are not
/// derivable from other tables, such as Fimbu AI interactions. Survives
/// application restarts (unlike in-memory counters).
/// </summary>
public class PlatformCounter
{
    public string Key { get; set; } = string.Empty;
    public long Value { get; set; }
}

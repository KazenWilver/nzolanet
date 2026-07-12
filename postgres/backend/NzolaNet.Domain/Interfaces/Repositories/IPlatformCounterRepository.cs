namespace NzolaNet.Domain.Interfaces.Repositories;

/// <summary>
/// Stores and retrieves persistent named counters for platform metrics.
/// </summary>
public interface IPlatformCounterRepository
{
    /// <summary>
    /// Atomically increments the named counter, creating it when it does not exist.
    /// </summary>
    Task IncrementAsync(string key, long by = 1);

    /// <summary>
    /// Gets the current value of a named counter, returning zero when absent.
    /// </summary>
    Task<long> GetAsync(string key);

    /// <summary>
    /// Well-known counter keys.
    /// </summary>
    public static class Keys
    {
        public const string FimbuInteractions = "fimbu.interactions";
        public const string FimbuMessages = "fimbu.messages";
    }
}

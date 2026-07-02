using System.Collections.Concurrent;
using System.Threading;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Application.Services;

/// <summary>
/// Implementação em memória de métricas de administração para consumo em dashboards.
/// </summary>
public sealed class AdminAnalyticsStore : IAdminAnalyticsStore
{
    private readonly ConcurrentQueue<AdminMetricsSample> _samples = new();
    private const int MaxSamples = 720; // até ~1 hora com atualização a cada 5s

    private long _deletedGroups;
    private long _fimbuInteractions;
    private long _fimbuMessages;

    public void RecordGroupDeleted()
    {
        Interlocked.Increment(ref _deletedGroups);
    }

    public void RecordFimbuInteraction(Guid userId, bool assistantMessageCreated)
    {
        if (userId == Guid.Empty)
        {
            return;
        }

        Interlocked.Increment(ref _fimbuInteractions);
        if (assistantMessageCreated)
        {
            Interlocked.Increment(ref _fimbuMessages);
        }
    }

    public void RegisterMetricsSample(int totalUsers, int onlineUsers, long totalFimbuInteractions)
    {
        var safeTotalUsers = Math.Max(0, totalUsers);
        var safeOnlineUsers = Math.Clamp(onlineUsers, 0, safeTotalUsers);
        _samples.Enqueue(new AdminMetricsSample(
            DateTime.UtcNow,
            safeTotalUsers,
            safeOnlineUsers,
            Math.Max(0, totalFimbuInteractions)));

        while (_samples.Count > MaxSamples && _samples.TryDequeue(out _))
        {
        }
    }

    public AdminAnalyticsSnapshot GetSnapshot()
    {
        var snapshot = _samples.ToArray();
        var averageOnline = 0d;
        var averageOffline = 0d;
        var averageAiUsage = 0d;

        if (snapshot.Length > 0)
        {
            averageOnline = snapshot.Average(sample =>
                sample.TotalUsers == 0 ? 0d : (sample.OnlineUsers * 100d) / sample.TotalUsers);

            averageOffline = snapshot.Average(sample =>
                sample.TotalUsers == 0 ? 0d : ((sample.TotalUsers - sample.OnlineUsers) * 100d) / sample.TotalUsers);

            long previousInteractions = snapshot[0].TotalFimbuInteractions;
            var usagePercentages = new List<double>(snapshot.Length);

            foreach (var sample in snapshot)
            {
                var delta = Math.Max(0, sample.TotalFimbuInteractions - previousInteractions);
                previousInteractions = sample.TotalFimbuInteractions;

                var usagePercent = sample.TotalUsers == 0
                    ? 0d
                    : Math.Min(100d, (delta * 100d) / sample.TotalUsers);

                usagePercentages.Add(usagePercent);
            }

            averageAiUsage = usagePercentages.Count == 0 ? 0d : usagePercentages.Average();
        }

        return new AdminAnalyticsSnapshot
        {
            TotalDeletedGroups = Interlocked.Read(ref _deletedGroups),
            TotalFimbuInteractions = Interlocked.Read(ref _fimbuInteractions),
            TotalFimbuMessages = Interlocked.Read(ref _fimbuMessages),
            AverageOnlinePercent = Math.Round(averageOnline, 2),
            AverageOfflinePercent = Math.Round(averageOffline, 2),
            AverageAiUsagePercent = Math.Round(averageAiUsage, 2)
        };
    }

    private sealed record AdminMetricsSample(
        DateTime TimestampUtc,
        int TotalUsers,
        int OnlineUsers,
        long TotalFimbuInteractions);
}

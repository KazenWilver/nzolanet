namespace NzolaNet.Application.Interfaces;

/// <summary>
/// Armazena contadores de telemetria administrativa em memória para dashboards em tempo real.
/// </summary>
public interface IAdminAnalyticsStore
{
    void RecordGroupDeleted();

    void RecordFimbuInteraction(Guid userId, bool assistantMessageCreated);

    void RegisterMetricsSample(int totalUsers, int onlineUsers, long totalFimbuInteractions);

    AdminAnalyticsSnapshot GetSnapshot();
}

/// <summary>
/// Snapshot agregado dos contadores e médias para a área administrativa.
/// </summary>
public sealed class AdminAnalyticsSnapshot
{
    public long TotalDeletedGroups { get; init; }

    public long TotalFimbuInteractions { get; init; }

    public long TotalFimbuMessages { get; init; }

    public double AverageOnlinePercent { get; init; }

    public double AverageOfflinePercent { get; init; }

    public double AverageAiUsagePercent { get; init; }
}

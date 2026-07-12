namespace NzolaNet.Application.Interfaces;

/// <summary>
/// Difunde actualizações de métricas em tempo real para o painel de administração.
/// </summary>
public interface IAdminMetricsBroadcaster
{
    Task BroadcastPresenceMetricsAsync(CancellationToken cancellationToken = default);
}

namespace NzolaNet.Application.Interfaces;

/// <summary>
/// Publica eventos realtime para clientes administradores.
/// </summary>
public interface IAdminRealtimeNotifier
{
    Task NotifyMetricsChangedAsync(CancellationToken cancellationToken = default);

    Task NotifyReportsChangedAsync(CancellationToken cancellationToken = default);
}

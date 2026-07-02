using Microsoft.AspNetCore.SignalR;
using NzolaNet.Api.Hubs;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Api.Services;

public class SignalRAdminRealtimeNotifier : IAdminRealtimeNotifier
{
    private readonly IHubContext<AdminHub> _hubContext;

    public SignalRAdminRealtimeNotifier(IHubContext<AdminHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task NotifyMetricsChangedAsync(CancellationToken cancellationToken = default)
    {
        return _hubContext.Clients
            .Group(AdminHub.AdminGroupName)
            .SendAsync("AdminMetricsUpdated", cancellationToken);
    }

    public Task NotifyReportsChangedAsync(CancellationToken cancellationToken = default)
    {
        return _hubContext.Clients
            .Group(AdminHub.AdminGroupName)
            .SendAsync("AdminReportsUpdated", cancellationToken);
    }
}

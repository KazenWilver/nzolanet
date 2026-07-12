using Microsoft.AspNetCore.SignalR;
using NzolaNet.Api.Hubs;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Interfaces.Repositories;

namespace NzolaNet.Api.Services;

public sealed class SignalRAdminMetricsBroadcaster : IAdminMetricsBroadcaster
{
    private readonly IHubContext<AdminHub> _hubContext;
    private readonly IUserPresenceService _presenceService;
    private readonly IServiceScopeFactory _scopeFactory;

    public SignalRAdminMetricsBroadcaster(
        IHubContext<AdminHub> hubContext,
        IUserPresenceService presenceService,
        IServiceScopeFactory scopeFactory)
    {
        _hubContext = hubContext;
        _presenceService = presenceService;
        _scopeFactory = scopeFactory;
    }

    public async Task BroadcastPresenceMetricsAsync(CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
        var totalUtilizadores = await userRepository.GetTotalCountAsync();
        var totalOnline = Math.Min(_presenceService.GetOnlineUsersCount(), totalUtilizadores);

        await _hubContext.Clients
            .Group(AdminHub.DashboardGroup)
            .SendAsync(
                "PresenceMetricsUpdated",
                new
                {
                    totalUtilizadoresOnline = totalOnline,
                    totalUtilizadoresOffline = totalUtilizadores - totalOnline
                },
                cancellationToken);
    }
}

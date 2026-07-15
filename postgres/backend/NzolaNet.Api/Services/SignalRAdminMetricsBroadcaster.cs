using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using NzolaNet.Api.Hubs;
using NzolaNet.Application.DTOs.Admin;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Entities;
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
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var totalUtilizadores = await userRepository.GetTotalCountAsync();
        var onlineIds = _presenceService.GetOnlineUserIds();
        var totalOnline = Math.Min(onlineIds.Count, totalUtilizadores);
        var onlineUsers = await BuildOnlineUsersAsync(userManager, onlineIds);

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

        await _hubContext.Clients
            .Group(AdminHub.DashboardGroup)
            .SendAsync("OnlineUsersUpdated", onlineUsers, cancellationToken);
    }

    private static async Task<IReadOnlyList<AdminOnlineUserDto>> BuildOnlineUsersAsync(
        UserManager<User> userManager,
        IReadOnlyCollection<Guid> onlineIds)
    {
        var result = new List<AdminOnlineUserDto>();

        foreach (var userId in onlineIds)
        {
            var user = await userManager.FindByIdAsync(userId.ToString());
            if (user is null)
            {
                continue;
            }

            result.Add(new AdminOnlineUserDto
            {
                Id = user.Id,
                Username = user.UserName ?? string.Empty,
                DisplayName = user.DisplayName,
                ProfilePhotoUrl = user.ProfilePhoto,
                IsOnline = true
            });
        }

        return result
            .OrderBy(user => user.DisplayName ?? user.Username, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}

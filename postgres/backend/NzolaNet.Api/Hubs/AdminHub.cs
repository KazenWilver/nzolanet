using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Api.Hubs;

[Authorize(Roles = "Admin")]
public class AdminHub : Hub
{
    private readonly IAdminMetricsBroadcaster _adminMetricsBroadcaster;

    public const string DashboardGroup = "admin-dashboard";

    public AdminHub(IAdminMetricsBroadcaster adminMetricsBroadcaster)
    {
        _adminMetricsBroadcaster = adminMetricsBroadcaster;
    }

    public override async Task OnConnectedAsync()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, DashboardGroup);
        await _adminMetricsBroadcaster.BroadcastPresenceMetricsAsync();
        await base.OnConnectedAsync();
    }
}

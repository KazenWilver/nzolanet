using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace NzolaNet.Api.Hubs;

[Authorize(Roles = "Admin")]
public class AdminHub : Hub
{
    public const string DashboardGroup = "admin-dashboard";

    public override async Task OnConnectedAsync()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, DashboardGroup);
        await base.OnConnectedAsync();
    }
}

using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using NzolaNet.Api.Helpers;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Interfaces.Repositories;

namespace NzolaNet.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IConversationRepository _conversationRepository;
    private readonly IChatRealtimeNotifier _chatRealtimeNotifier;

    public ChatHub(
        IConversationRepository conversationRepository,
        IChatRealtimeNotifier chatRealtimeNotifier)
    {
        _conversationRepository = conversationRepository;
        _chatRealtimeNotifier = chatRealtimeNotifier;
    }

    public async Task JoinConversation(Guid conversationId)
    {
        var userId = AuthClaimsHelper.GetUserId(Context.User!);
        var conversation = await _conversationRepository.GetByIdForUserAsync(conversationId, userId);

        if (conversation == null)
        {
            throw new HubException("Conversa não encontrada.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GetGroupName(conversationId));
    }

    public async Task LeaveConversation(Guid conversationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetGroupName(conversationId));
    }

    public async Task NotifyTyping(Guid conversationId)
    {
        var userId = AuthClaimsHelper.GetUserId(Context.User!);
        await EnsureParticipantAsync(userId, conversationId);

        var username = Context.User?.FindFirst(JwtRegisteredClaimNames.UniqueName)?.Value ?? string.Empty;
        await _chatRealtimeNotifier.NotifyTypingAsync(conversationId, userId, username, true);
    }

    public async Task NotifyStoppedTyping(Guid conversationId)
    {
        var userId = AuthClaimsHelper.GetUserId(Context.User!);
        await EnsureParticipantAsync(userId, conversationId);

        var username = Context.User?.FindFirst(JwtRegisteredClaimNames.UniqueName)?.Value ?? string.Empty;
        await _chatRealtimeNotifier.NotifyTypingAsync(conversationId, userId, username, false);
    }

    private async Task EnsureParticipantAsync(Guid userId, Guid conversationId)
    {
        var conversation = await _conversationRepository.GetByIdForUserAsync(conversationId, userId);
        if (conversation == null)
        {
            throw new HubException("Conversa não encontrada.");
        }
    }

    internal static string GetGroupName(Guid conversationId) => $"conversation:{conversationId}";
}

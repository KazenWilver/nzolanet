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

    public async Task JoinConversation(string conversationId)
    {
        var parsedId = ParseConversationId(conversationId);
        var userId = AuthClaimsHelper.GetUserId(Context.User!);
        var conversation = await _conversationRepository.GetByIdForUserAsync(parsedId, userId);

        if (conversation == null)
        {
            throw new HubException("Conversa não encontrada.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GetGroupName(parsedId));
    }

    public async Task LeaveConversation(string conversationId)
    {
        var parsedId = ParseConversationId(conversationId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetGroupName(parsedId));
    }

    public async Task NotifyTyping(string conversationId)
    {
        var parsedId = ParseConversationId(conversationId);
        var userId = AuthClaimsHelper.GetUserId(Context.User!);
        await EnsureParticipantAsync(userId, parsedId);

        var username = Context.User?.FindFirst(JwtRegisteredClaimNames.UniqueName)?.Value ?? string.Empty;
        await Clients.OthersInGroup(GetGroupName(parsedId)).SendAsync("TypingChanged", new
        {
            ConversationId = parsedId.ToString(),
            UserId = userId.ToString(),
            Username = username,
            IsTyping = true
        });
    }

    public async Task NotifyStoppedTyping(string conversationId)
    {
        var parsedId = ParseConversationId(conversationId);
        var userId = AuthClaimsHelper.GetUserId(Context.User!);
        await EnsureParticipantAsync(userId, parsedId);

        var username = Context.User?.FindFirst(JwtRegisteredClaimNames.UniqueName)?.Value ?? string.Empty;
        await Clients.OthersInGroup(GetGroupName(parsedId)).SendAsync("TypingChanged", new
        {
            ConversationId = parsedId.ToString(),
            UserId = userId.ToString(),
            Username = username,
            IsTyping = false
        });
    }

    private async Task EnsureParticipantAsync(Guid userId, Guid conversationId)
    {
        var conversation = await _conversationRepository.GetByIdForUserAsync(conversationId, userId);
        if (conversation == null)
        {
            throw new HubException("Conversa não encontrada.");
        }
    }

    private static Guid ParseConversationId(string conversationId)
    {
        if (!Guid.TryParse(conversationId, out var parsedId))
        {
            throw new HubException("Identificador de conversa inválido.");
        }

        return parsedId;
    }

    internal static string GetGroupName(Guid conversationId) => $"conversation:{conversationId}";
}

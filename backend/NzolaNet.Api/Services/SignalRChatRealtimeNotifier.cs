using Microsoft.AspNetCore.SignalR;
using NzolaNet.Api.Hubs;
using NzolaNet.Application.DTOs.Conversations;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Api.Services;

public class SignalRChatRealtimeNotifier : IChatRealtimeNotifier
{
    private readonly IHubContext<ChatHub> _hubContext;

    public SignalRChatRealtimeNotifier(IHubContext<ChatHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyMessageAsync(Guid conversationId, MessageResponseDto message, Guid senderUserId)
    {
        var payload = new
        {
            message.Id,
            message.ConversationId,
            message.SenderId,
            message.SenderUsername,
            message.SenderDisplayName,
            message.SenderPhotoUrl,
            message.Text,
            message.CreatedAt
        };

        await _hubContext.Clients
            .Group(ChatHub.GetGroupName(conversationId))
            .SendAsync("MessageReceived", payload);
    }

    public async Task NotifyTypingAsync(Guid conversationId, Guid userId, string username, bool isTyping)
    {
        await _hubContext.Clients
            .Group(ChatHub.GetGroupName(conversationId))
            .SendAsync("TypingChanged", new
            {
                ConversationId = conversationId,
                UserId = userId,
                Username = username,
                IsTyping = isTyping
            });
    }
}

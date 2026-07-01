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
            message.ImageUrl,
            message.VideoUrl,
            message.IsGif,
            message.ReplyTo,
            message.Reactions,
            message.CreatedAt,
            message.IsRead
        };

        await _hubContext.Clients
            .Group(ChatHub.GetGroupName(conversationId))
            .SendAsync("MessageReceived", payload);
    }

    public async Task NotifyReadReceiptAsync(Guid conversationId, Guid readerUserId, DateTime readAt)
    {
        await _hubContext.Clients
            .Group(ChatHub.GetGroupName(conversationId))
            .SendAsync("ReadReceiptUpdated", new
            {
                ConversationId = conversationId,
                ReaderUserId = readerUserId,
                ReadAt = readAt
            });
    }

    public async Task NotifyTypingAsync(Guid conversationId, Guid userId, string username, bool isTyping)
    {
        await _hubContext.Clients
            .Group(ChatHub.GetGroupName(conversationId))
            .SendAsync("TypingChanged", new
            {
                ConversationId = conversationId.ToString(),
                UserId = userId.ToString(),
                Username = username,
                IsTyping = isTyping
            });
    }

    public async Task NotifyReactionChangedAsync(
        Guid conversationId,
        Guid messageId,
        IReadOnlyList<MessageReactionSummaryDto> reactions)
    {
        await _hubContext.Clients
            .Group(ChatHub.GetGroupName(conversationId))
            .SendAsync("MessageReactionChanged", new
            {
                ConversationId = conversationId.ToString(),
                MessageId = messageId.ToString(),
                Reactions = reactions
            });
    }
}

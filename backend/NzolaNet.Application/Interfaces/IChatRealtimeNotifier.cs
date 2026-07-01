using NzolaNet.Application.DTOs.Conversations;

namespace NzolaNet.Application.Interfaces;

/// <summary>
/// Notifica clientes em tempo real sobre eventos de chat.
/// </summary>
public interface IChatRealtimeNotifier
{
    Task NotifyMessageAsync(Guid conversationId, MessageResponseDto message, Guid senderUserId);

    Task NotifyReadReceiptAsync(Guid conversationId, Guid readerUserId, DateTime readAt);

    Task NotifyTypingAsync(Guid conversationId, Guid userId, string username, bool isTyping);

    Task NotifyReactionChangedAsync(
        Guid conversationId,
        Guid messageId,
        IReadOnlyList<MessageReactionSummaryDto> reactions);
}

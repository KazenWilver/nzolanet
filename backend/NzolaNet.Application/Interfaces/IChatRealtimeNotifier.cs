using NzolaNet.Application.DTOs.Conversations;

namespace NzolaNet.Application.Interfaces;

/// <summary>
/// Notifica clientes em tempo real sobre eventos de chat.
/// </summary>
public interface IChatRealtimeNotifier
{
    Task NotifyMessageAsync(Guid conversationId, MessageResponseDto message, Guid senderUserId);

    Task NotifyTypingAsync(Guid conversationId, Guid userId, string username, bool isTyping);
}

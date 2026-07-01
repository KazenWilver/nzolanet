using NzolaNet.Application.DTOs.Conversations;

namespace NzolaNet.Application.Interfaces;

public interface IConversationService
{
    Task<IEnumerable<ConversationListItemDto>> GetConversationsAsync(Guid userId);
    Task<ConversationListItemDto> GetOrCreateConversationAsync(Guid userId, Guid participantId);
    Task<IEnumerable<MessageResponseDto>> GetMessagesAsync(
        Guid userId,
        Guid conversationId,
        int limit = 50,
        DateTime? before = null);
    Task<MessageResponseDto> SendMessageAsync(
        Guid userId,
        Guid conversationId,
        string? text,
        Microsoft.AspNetCore.Http.IFormFile? image = null);
    Task<DateTime> MarkAsReadAsync(Guid userId, Guid conversationId);
    Task<UnreadMessagesCountDto> GetUnreadCountAsync(Guid userId);
}

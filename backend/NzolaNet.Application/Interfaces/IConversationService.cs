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
        Microsoft.AspNetCore.Http.IFormFile? image = null,
        Microsoft.AspNetCore.Http.IFormFile? video = null,
        Guid? replyToMessageId = null);
    Task<IReadOnlyList<MessageReactionSummaryDto>> ToggleReactionAsync(
        Guid userId,
        Guid conversationId,
        Guid messageId,
        string emoji);
    Task<DateTime> MarkAsReadAsync(Guid userId, Guid conversationId);
    Task<UnreadMessagesCountDto> GetUnreadCountAsync(Guid userId);
}

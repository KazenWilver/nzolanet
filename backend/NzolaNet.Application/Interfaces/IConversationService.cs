using NzolaNet.Application.DTOs.Conversations;

namespace NzolaNet.Application.Interfaces;

public interface IConversationService
{
    int MessageEditDeleteWindowMinutes { get; }
    Task<IEnumerable<ConversationListItemDto>> GetConversationsAsync(Guid userId);
    Task<ConversationDetailDto> GetConversationAsync(Guid userId, Guid conversationId);
    Task<ConversationListItemDto> GetOrCreateConversationAsync(Guid userId, Guid participantId);
    Task<ConversationListItemDto> CreateGroupConversationAsync(Guid userId, CreateGroupConversationDto dto);
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
        Guid? replyToMessageId = null,
        string? remoteImageUrl = null);
    Task<MessageResponseDto> EditMessageAsync(
        Guid userId,
        Guid conversationId,
        Guid messageId,
        string text);
    Task DeleteMessageAsync(
        Guid userId,
        Guid conversationId,
        Guid messageId,
        string scope);
    Task<IReadOnlyList<MessageResponseDto>> ForwardMessageAsync(
        Guid userId,
        Guid sourceConversationId,
        Guid messageId,
        IReadOnlyList<Guid> targetConversationIds,
        string? caption = null);
    Task<IReadOnlyList<MessageReactionSummaryDto>> ToggleReactionAsync(
        Guid userId,
        Guid conversationId,
        Guid messageId,
        string emoji);
    Task<DateTime> MarkAsReadAsync(Guid userId, Guid conversationId);
    Task<UnreadMessagesCountDto> GetUnreadCountAsync(Guid userId);
    Task<ConversationDetailDto> AddGroupParticipantsAsync(Guid userId, Guid conversationId, IReadOnlyList<Guid> participantIds);
    Task<ConversationDetailDto> UpdateGroupAsync(
        Guid userId,
        Guid conversationId,
        UpdateGroupConversationDto dto,
        Microsoft.AspNetCore.Http.IFormFile? image = null);
}

using NzolaNet.Domain.Entities;

namespace NzolaNet.Domain.Interfaces.Repositories;

public interface IConversationRepository
{
    Task<IEnumerable<Conversation>> GetByUserIdAsync(Guid userId);
    Task<Conversation?> GetByIdForUserAsync(Guid conversationId, Guid userId);
    Task<Conversation?> FindDirectConversationAsync(Guid userId, Guid otherUserId);
    Task<Conversation> CreateDirectConversationAsync(Guid userId, Guid otherUserId);
    Task<Message> AddMessageAsync(Message message);
    Task<IEnumerable<Message>> GetMessagesAsync(
        Guid conversationId,
        int limit = 50,
        DateTime? before = null);
    Task<Message?> GetLastMessageAsync(Guid conversationId);
    Task<Message?> GetMessageByIdAsync(Guid messageId, Guid conversationId);
    Task<bool> MarkAsReadAsync(Guid conversationId, Guid userId, DateTime readAt);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task<int> GetUnreadCountForConversationAsync(Guid conversationId, Guid userId);
    Task<DateTime?> GetOtherParticipantLastReadAtAsync(Guid conversationId, Guid userId);
    Task<IReadOnlyList<Guid>> GetOtherParticipantIdsAsync(Guid conversationId, Guid userId);
}

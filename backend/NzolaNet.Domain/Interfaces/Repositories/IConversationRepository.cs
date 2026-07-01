using NzolaNet.Domain.Entities;

namespace NzolaNet.Domain.Interfaces.Repositories;

public interface IConversationRepository
{
    Task<IEnumerable<Conversation>> GetByUserIdAsync(Guid userId);
    Task<Conversation?> GetByIdForUserAsync(Guid conversationId, Guid userId);
    Task<Conversation?> FindDirectConversationAsync(Guid userId, Guid otherUserId);
    Task<Conversation> CreateDirectConversationAsync(Guid userId, Guid otherUserId);
    Task<Conversation> CreateGroupConversationAsync(Guid creatorUserId, string title, IReadOnlyCollection<Guid> participantIds);
    Task<Message> AddMessageAsync(Message message);
    Task<IReadOnlyList<Message>> AddMessagesAsync(IEnumerable<Message> messages);
    Task<IEnumerable<Message>> GetMessagesAsync(
        Guid conversationId,
        Guid? viewerUserId = null,
        int limit = 50,
        DateTime? before = null);
    Task<Message?> GetLastMessageAsync(Guid conversationId);
    Task<Message?> GetMessageByIdAsync(Guid messageId, Guid conversationId);
    Task<bool> MarkAsReadAsync(Guid conversationId, Guid userId, DateTime readAt);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task<int> GetUnreadCountForConversationAsync(Guid conversationId, Guid userId);
    Task<DateTime?> GetOtherParticipantLastReadAtAsync(Guid conversationId, Guid userId);
    Task<IReadOnlyList<Guid>> GetOtherParticipantIdsAsync(Guid conversationId, Guid userId);
    Task<int> GetParticipantsCountAsync(Guid conversationId);
    Task<bool> IsParticipantAsync(Guid conversationId, Guid userId);
    Task<bool> IsMessageHiddenForUserAsync(Guid messageId, Guid userId);
    Task HideMessageForUserAsync(Guid messageId, Guid userId);
    Task UpdateMessageAsync(Message message);
}

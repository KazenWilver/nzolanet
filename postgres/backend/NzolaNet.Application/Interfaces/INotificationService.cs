using NzolaNet.Application.DTOs.Notifications;

namespace NzolaNet.Application.Interfaces;

public interface INotificationService
{
    Task<IEnumerable<NotificationResponseDto>> GetForUserAsync(Guid userId);
    Task<UnreadCountDto> GetUnreadCountAsync(Guid userId);
    Task MarkAsReadAsync(Guid userId, Guid notificationId);
    Task MarkAllAsReadAsync(Guid userId);
    Task DeleteAsync(Guid userId, Guid notificationId);
    Task TryCreateBazeNotificationAsync(Guid actorId, Guid publicationId, Guid recipientId);
    Task TryCreateCommentNotificationAsync(Guid actorId, Guid publicationId, Guid commentId, Guid recipientId);
    Task TryCreateFollowNotificationAsync(Guid actorId, Guid recipientId);
    Task TryCreateFollowRequestNotificationAsync(Guid actorId, Guid recipientId);
    Task TryCreateFollowAcceptedNotificationAsync(Guid actorId, Guid recipientId);
    Task TryCreateFollowRejectedNotificationAsync(Guid actorId, Guid recipientId);
    Task CleanupFollowRequestNotificationsAsync(Guid recipientId, Guid actorId);
    Task CleanupBazeNotificationAsync(Guid actorId, Guid publicationId, Guid recipientId);
    Task TryCreateMessageNotificationAsync(
        Guid actorId,
        Guid conversationId,
        Guid messageId,
        Guid recipientId,
        string? messagePreview);
    Task TryCreateMentionNotificationAsync(Guid actorId, Guid publicationId, Guid recipientId);
    Task TryCreateChatMentionNotificationAsync(
        Guid actorId,
        Guid conversationId,
        Guid messageId,
        Guid recipientId,
        string? messagePreview);
    Task TryCreateGroupAddedNotificationAsync(Guid actorId, Guid conversationId, Guid recipientId);
    Task TryCreateRepostNotificationAsync(Guid actorId, Guid publicationId, Guid recipientId, string? preview);
}

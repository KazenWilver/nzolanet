using NzolaNet.Domain.Entities;

namespace NzolaNet.Domain.Interfaces.Repositories;

public interface INotificationRepository
{
    Task<IEnumerable<Notification>> GetByRecipientAsync(Guid recipientId);
    Task<int> GetUnreadCountAsync(Guid recipientId);
    Task<Notification?> GetByIdAsync(Guid id);
    Task<bool> CreateAsync(Notification notification);
    Task<bool> MarkAsReadAsync(Guid recipientId, Guid notificationId);
    Task<bool> MarkAllAsReadAsync(Guid recipientId);
    Task<bool> DeleteAsync(Guid recipientId, Guid notificationId);
    Task DeleteByPublicationIdAsync(Guid publicationId);
    Task DeleteByCommentIdAsync(Guid commentId);
    Task<bool> ExistsFollowRequestNotificationAsync(Guid recipientId, Guid actorId);
    Task DeleteFollowRequestsAsync(Guid recipientId, Guid actorId);
    Task DeleteBazeNotificationAsync(Guid actorId, Guid publicationId, Guid recipientId);
}

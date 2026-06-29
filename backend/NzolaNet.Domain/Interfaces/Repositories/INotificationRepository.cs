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
}

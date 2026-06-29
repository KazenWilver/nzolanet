using Microsoft.EntityFrameworkCore;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;
using NzolaNet.Infrastructure.Data;

namespace NzolaNet.Infrastructure.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly ApplicationDbContext _context;

    public NotificationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Notification>> GetByRecipientAsync(Guid recipientId)
    {
        return await _context.Notifications
            .Include(n => n.Actor)
            .Include(n => n.Publication)
            .Include(n => n.Comment)
            .Where(n => n.RecipientId == recipientId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(Guid recipientId)
    {
        return await _context.Notifications.CountAsync(n => n.RecipientId == recipientId && !n.IsRead);
    }

    public async Task<Notification?> GetByIdAsync(Guid id)
    {
        return await _context.Notifications
            .Include(n => n.Actor)
            .Include(n => n.Publication)
            .Include(n => n.Comment)
            .FirstOrDefaultAsync(n => n.Id == id);
    }

    public async Task<bool> CreateAsync(Notification notification)
    {
        _context.Notifications.Add(notification);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> MarkAsReadAsync(Guid recipientId, Guid notificationId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.RecipientId == recipientId);

        if (notification == null)
        {
            return false;
        }

        notification.IsRead = true;
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> MarkAllAsReadAsync(Guid recipientId)
    {
        var unread = await _context.Notifications
            .Where(n => n.RecipientId == recipientId && !n.IsRead)
            .ToListAsync();

        if (unread.Count == 0)
        {
            return true;
        }

        foreach (var notification in unread)
        {
            notification.IsRead = true;
        }

        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteAsync(Guid recipientId, Guid notificationId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.RecipientId == recipientId);

        if (notification == null)
        {
            return false;
        }

        _context.Notifications.Remove(notification);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task DeleteByPublicationIdAsync(Guid publicationId)
    {
        var commentIds = await _context.Comments
            .Where(c => c.PostId == publicationId)
            .Select(c => c.Id)
            .ToListAsync();

        var notifications = await _context.Notifications
            .Where(n =>
                n.PublicationId == publicationId ||
                (n.CommentId != null && commentIds.Contains(n.CommentId.Value)))
            .ToListAsync();

        if (notifications.Count == 0)
        {
            return;
        }

        _context.Notifications.RemoveRange(notifications);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteByCommentIdAsync(Guid commentId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.CommentId == commentId)
            .ToListAsync();

        if (notifications.Count == 0)
        {
            return;
        }

        _context.Notifications.RemoveRange(notifications);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> ExistsFollowRequestNotificationAsync(Guid recipientId, Guid actorId)
    {
        return await _context.Notifications.AnyAsync(
            n => n.RecipientId == recipientId &&
                 n.ActorId == actorId &&
                 n.Type == "follow_request");
    }

    public async Task DeleteFollowRequestsAsync(Guid recipientId, Guid actorId)
    {
        var notifications = await _context.Notifications
            .Where(n =>
                n.RecipientId == recipientId &&
                n.ActorId == actorId &&
                n.Type == "follow_request")
            .ToListAsync();

        if (notifications.Count == 0)
        {
            return;
        }

        _context.Notifications.RemoveRange(notifications);
        await _context.SaveChangesAsync();
    }
}

using Microsoft.Extensions.Logging;
using NzolaNet.Application.DTOs.Notifications;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;

namespace NzolaNet.Application.Services;

public class NotificationService : INotificationService
{
    private const int PreviewMaxLength = 100;

    private readonly INotificationRepository _notificationRepository;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        INotificationRepository notificationRepository,
        ILogger<NotificationService> logger)
    {
        _notificationRepository = notificationRepository;
        _logger = logger;
    }

    public async Task<IEnumerable<NotificationResponseDto>> GetForUserAsync(Guid userId)
    {
        var notifications = await _notificationRepository.GetByRecipientAsync(userId);
        return notifications.Select(MapToDto);
    }

    public async Task<UnreadCountDto> GetUnreadCountAsync(Guid userId)
    {
        var count = await _notificationRepository.GetUnreadCountAsync(userId);
        return new UnreadCountDto { Count = count };
    }

    public async Task MarkAsReadAsync(Guid userId, Guid notificationId)
    {
        var updated = await _notificationRepository.MarkAsReadAsync(userId, notificationId);
        if (!updated)
        {
            throw new ArgumentException("Notificação não encontrada.");
        }
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        await _notificationRepository.MarkAllAsReadAsync(userId);
    }

    public async Task DeleteAsync(Guid userId, Guid notificationId)
    {
        var deleted = await _notificationRepository.DeleteAsync(userId, notificationId);
        if (!deleted)
        {
            throw new ArgumentException("Notificação não encontrada.");
        }
    }

    public async Task TryCreateBazeNotificationAsync(Guid actorId, Guid publicationId, Guid recipientId)
    {
        if (actorId == recipientId)
        {
            return;
        }

        try
        {
            var notification = new Notification
            {
                RecipientId = recipientId,
                ActorId = actorId,
                Type = "baze",
                PublicationId = publicationId,
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepository.CreateAsync(notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao criar notificação de baze para o utilizador {RecipientId}.", recipientId);
        }
    }

    public async Task TryCreateCommentNotificationAsync(
        Guid actorId,
        Guid publicationId,
        Guid commentId,
        Guid recipientId)
    {
        if (actorId == recipientId)
        {
            return;
        }

        try
        {
            var notification = new Notification
            {
                RecipientId = recipientId,
                ActorId = actorId,
                Type = "comment",
                PublicationId = publicationId,
                CommentId = commentId,
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepository.CreateAsync(notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao criar notificação de comentário para o utilizador {RecipientId}.", recipientId);
        }
    }

    public async Task TryCreateFollowNotificationAsync(Guid actorId, Guid recipientId)
    {
        if (actorId == recipientId)
        {
            return;
        }

        try
        {
            var notification = new Notification
            {
                RecipientId = recipientId,
                ActorId = actorId,
                Type = "follow",
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepository.CreateAsync(notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao criar notificação de seguimento para o utilizador {RecipientId}.", recipientId);
        }
    }

    public async Task TryCreateFollowRequestNotificationAsync(Guid actorId, Guid recipientId)
    {
        if (actorId == recipientId)
        {
            return;
        }

        try
        {
            var notification = new Notification
            {
                RecipientId = recipientId,
                ActorId = actorId,
                Type = "follow_request",
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepository.CreateAsync(notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao criar notificação de pedido de seguimento para o utilizador {RecipientId}.", recipientId);
        }
    }

    public async Task TryCreateFollowAcceptedNotificationAsync(Guid actorId, Guid recipientId)
    {
        if (actorId == recipientId)
        {
            return;
        }

        try
        {
            var notification = new Notification
            {
                RecipientId = recipientId,
                ActorId = actorId,
                Type = "follow_accepted",
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepository.CreateAsync(notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao criar notificação de pedido aceite para o utilizador {RecipientId}.", recipientId);
        }
    }

    public async Task TryCreateFollowRejectedNotificationAsync(Guid actorId, Guid recipientId)
    {
        if (actorId == recipientId)
        {
            return;
        }

        try
        {
            var notification = new Notification
            {
                RecipientId = recipientId,
                ActorId = actorId,
                Type = "follow_rejected",
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepository.CreateAsync(notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao criar notificação de pedido recusado para o utilizador {RecipientId}.", recipientId);
        }
    }

    private NotificationResponseDto MapToDto(Notification notification)
    {
        var publicationText = notification.Publication?.Text;
        var commentText = notification.Comment?.Text;

        return new NotificationResponseDto
        {
            Id = notification.Id,
            Type = notification.Type,
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt,
            ActorId = notification.ActorId,
            ActorUsername = notification.Actor?.UserName ?? string.Empty,
            ActorDisplayName = notification.Actor?.DisplayName,
            ActorPhotoUrl = notification.Actor?.ProfilePhoto,
            PublicationId = notification.PublicationId,
            PublicationText = TruncatePreview(publicationText),
            CommentId = notification.CommentId,
            CommentText = TruncatePreview(commentText)
        };
    }

    private static string? TruncatePreview(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return text;
        }

        return text.Length <= PreviewMaxLength
            ? text
            : $"{text[..PreviewMaxLength]}...";
    }
}

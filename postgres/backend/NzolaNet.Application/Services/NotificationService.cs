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
            var alreadyExists = await _notificationRepository.ExistsFollowRequestNotificationAsync(recipientId, actorId);
            if (alreadyExists)
            {
                return;
            }

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

    public async Task CleanupFollowRequestNotificationsAsync(Guid recipientId, Guid actorId)
    {
        try
        {
            await _notificationRepository.DeleteFollowRequestsAsync(recipientId, actorId);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Falha ao limpar notificações de pedido de seguimento entre {ActorId} e {RecipientId}.",
                actorId,
                recipientId);
        }
    }

    public async Task CleanupBazeNotificationAsync(Guid actorId, Guid publicationId, Guid recipientId)
    {
        if (actorId == recipientId)
        {
            return;
        }

        try
        {
            await _notificationRepository.DeleteBazeNotificationAsync(actorId, publicationId, recipientId);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Falha ao remover notificação de baze entre {ActorId} e {RecipientId} na publicação {PublicationId}.",
                actorId,
                recipientId,
                publicationId);
        }
    }

    public async Task TryCreateMessageNotificationAsync(
        Guid actorId,
        Guid conversationId,
        Guid messageId,
        Guid recipientId,
        string? messagePreview)
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
                Type = "message",
                ConversationId = conversationId,
                MessageId = messageId,
                MessagePreview = TruncatePreview(messagePreview),
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepository.CreateAsync(notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Falha ao criar notificação de mensagem para o utilizador {RecipientId}.",
                recipientId);
        }
    }

    public async Task TryCreateChatMentionNotificationAsync(
        Guid actorId,
        Guid conversationId,
        Guid messageId,
        Guid recipientId,
        string? messagePreview)
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
                Type = "chat_mention",
                ConversationId = conversationId,
                MessageId = messageId,
                MessagePreview = TruncatePreview(messagePreview),
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepository.CreateAsync(notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Falha ao criar notificação de menção no chat para o utilizador {RecipientId}.",
                recipientId);
        }
    }

    public async Task TryCreateMentionNotificationAsync(Guid actorId, Guid publicationId, Guid recipientId)
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
                Type = "mention",
                PublicationId = publicationId,
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepository.CreateAsync(notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Falha ao criar notificação de menção para o utilizador {RecipientId}.",
                recipientId);
        }
    }

    public async Task TryCreateGroupAddedNotificationAsync(
        Guid actorId,
        Guid conversationId,
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
                Type = "group_added",
                ConversationId = conversationId,
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepository.CreateAsync(notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Falha ao criar notificação de grupo para o utilizador {RecipientId}.",
                recipientId);
        }
    }

    public async Task TryCreateRepostNotificationAsync(
        Guid actorId,
        Guid publicationId,
        Guid recipientId,
        string? preview)
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
                Type = "repost",
                PublicationId = publicationId,
                MessagePreview = TruncatePreview(preview),
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepository.CreateAsync(notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Falha ao criar notificação de repartilha para o utilizador {RecipientId}.",
                recipientId);
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
            CommentText = TruncatePreview(commentText),
            ConversationId = notification.ConversationId,
            MessageId = notification.MessageId,
            MessageText = TruncatePreview(notification.MessagePreview)
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

using Microsoft.AspNetCore.Http;
using NzolaNet.Application.DTOs.Conversations;
using NzolaNet.Application.Helpers;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;

namespace NzolaNet.Application.Services;

public class ConversationService : IConversationService
{
    private const int MaxMessageLength = 2000;
    private const int MaxMessagesPageSize = 100;

    private readonly IConversationRepository _conversationRepository;
    private readonly IMessageReactionRepository _messageReactionRepository;
    private readonly IUserRepository _userRepository;
    private readonly IFollowRepository _followRepository;
    private readonly IStorageService _storageService;
    private readonly INotificationService _notificationService;

    public ConversationService(
        IConversationRepository conversationRepository,
        IMessageReactionRepository messageReactionRepository,
        IUserRepository userRepository,
        IFollowRepository followRepository,
        IStorageService storageService,
        INotificationService notificationService)
    {
        _conversationRepository = conversationRepository;
        _messageReactionRepository = messageReactionRepository;
        _userRepository = userRepository;
        _followRepository = followRepository;
        _storageService = storageService;
        _notificationService = notificationService;
    }

    public async Task<IEnumerable<ConversationListItemDto>> GetConversationsAsync(Guid userId)
    {
        var conversations = await _conversationRepository.GetByUserIdAsync(userId);
        var items = new List<ConversationListItemDto>();

        foreach (var conversation in conversations)
        {
            items.Add(await MapConversationAsync(conversation, userId));
        }

        return items;
    }

    public async Task<ConversationListItemDto> GetOrCreateConversationAsync(Guid userId, Guid participantId)
    {
        if (userId == participantId)
        {
            throw new ArgumentException("Não é possível iniciar conversa consigo mesmo.");
        }

        var otherUser = await _userRepository.GetByIdAsync(participantId);
        if (otherUser == null)
        {
            throw new ArgumentException("Utilizador não encontrado.");
        }

        await EnsureCanMessageAsync(userId, participantId);

        var existing = await _conversationRepository.FindDirectConversationAsync(userId, participantId);
        var conversation = existing ?? await _conversationRepository.CreateDirectConversationAsync(userId, participantId);

        return await MapConversationAsync(conversation, userId);
    }

    public async Task<IEnumerable<MessageResponseDto>> GetMessagesAsync(
        Guid userId,
        Guid conversationId,
        int limit = 50,
        DateTime? before = null)
    {
        await EnsureParticipantAsync(userId, conversationId);

        var safeLimit = Math.Clamp(limit, 1, MaxMessagesPageSize);
        var messages = (await _conversationRepository.GetMessagesAsync(conversationId, safeLimit, before)).ToList();
        var otherLastRead = await _conversationRepository.GetOtherParticipantLastReadAtAsync(conversationId, userId);
        var reactions = await _messageReactionRepository.GetByMessageIdsAsync(messages.Select(m => m.Id));
        var reactionMap = BuildReactionSummaries(reactions, userId);

        return messages.Select(message => MapMessage(
            message,
            userId,
            otherLastRead,
            reactionMap.GetValueOrDefault(message.Id)));
    }

    public async Task<MessageResponseDto> SendMessageAsync(
        Guid userId,
        Guid conversationId,
        string? text,
        IFormFile? image = null,
        IFormFile? video = null,
        Guid? replyToMessageId = null)
    {
        await EnsureParticipantAsync(userId, conversationId);

        var trimmed = text?.Trim() ?? string.Empty;
        var hasImage = image is { Length: > 0 };
        var hasVideo = video is { Length: > 0 };

        if (string.IsNullOrWhiteSpace(trimmed) && !hasImage && !hasVideo)
        {
            throw new ArgumentException("A mensagem não pode estar vazia.");
        }

        if (trimmed.Length > MaxMessageLength)
        {
            throw new ArgumentException($"A mensagem não pode exceder {MaxMessageLength} caracteres.");
        }

        if (hasImage && hasVideo)
        {
            throw new ArgumentException("Envia apenas uma imagem ou um vídeo por mensagem.");
        }

        if (hasImage)
        {
            FileHelper.ValidateImageFile(image!);
        }

        if (hasVideo)
        {
            FileHelper.ValidateVideoFile(video!);
        }

        if (replyToMessageId.HasValue)
        {
            var replyTarget = await _conversationRepository.GetMessageByIdAsync(replyToMessageId.Value, conversationId);
            if (replyTarget == null)
            {
                throw new ArgumentException("A mensagem a que responde não foi encontrada.");
            }
        }

        var message = new Message
        {
            ConversationId = conversationId,
            SenderId = userId,
            Text = trimmed,
            ReplyToMessageId = replyToMessageId,
            CreatedAt = DateTime.UtcNow
        };

        if (hasImage)
        {
            message.ImagePath = await _storageService.SaveFileAsync(image!, "messages");
        }

        if (hasVideo)
        {
            message.VideoPath = await _storageService.SaveFileAsync(video!, "messages");
        }

        var saved = await _conversationRepository.AddMessageAsync(message);
        var reloaded = await _conversationRepository.GetMessageByIdAsync(saved.Id, conversationId) ?? saved;
        var otherLastRead = await _conversationRepository.GetOtherParticipantLastReadAtAsync(conversationId, userId);
        var response = MapMessage(reloaded, userId, otherLastRead, Array.Empty<MessageReactionSummaryDto>());

        var preview = FormatMessagePreview(reloaded);
        var recipients = await _conversationRepository.GetOtherParticipantIdsAsync(conversationId, userId);
        foreach (var recipientId in recipients)
        {
            await _notificationService.TryCreateMessageNotificationAsync(
                userId,
                conversationId,
                recipientId,
                preview);
        }

        return response;
    }

    public async Task<IReadOnlyList<MessageReactionSummaryDto>> ToggleReactionAsync(
        Guid userId,
        Guid conversationId,
        Guid messageId,
        string emoji)
    {
        await EnsureParticipantAsync(userId, conversationId);

        var trimmedEmoji = emoji.Trim();
        if (string.IsNullOrWhiteSpace(trimmedEmoji))
        {
            throw new ArgumentException("Emoji inválido.");
        }

        var message = await _conversationRepository.GetMessageByIdAsync(messageId, conversationId);
        if (message == null)
        {
            throw new ArgumentException("Mensagem não encontrada.");
        }

        var existing = await _messageReactionRepository.GetByMessageAndUserAsync(messageId, userId);
        if (existing != null)
        {
            if (existing.Emoji == trimmedEmoji)
            {
                await _messageReactionRepository.DeleteAsync(existing);
            }
            else
            {
                existing.Emoji = trimmedEmoji;
                existing.CreatedAt = DateTime.UtcNow;
                await _messageReactionRepository.UpdateAsync(existing);
            }
        }
        else
        {
            await _messageReactionRepository.CreateAsync(new MessageReaction
            {
                MessageId = messageId,
                UserId = userId,
                Emoji = trimmedEmoji,
                CreatedAt = DateTime.UtcNow
            });
        }

        var reactions = await _messageReactionRepository.GetByMessageIdsAsync(new[] { messageId });
        var summaries = BuildReactionSummaries(reactions, userId).GetValueOrDefault(messageId)
            ?? Array.Empty<MessageReactionSummaryDto>();

        return summaries;
    }

    public async Task<DateTime> MarkAsReadAsync(Guid userId, Guid conversationId)
    {
        await EnsureParticipantAsync(userId, conversationId);
        var readAt = DateTime.UtcNow;
        await _conversationRepository.MarkAsReadAsync(conversationId, userId, readAt);
        return readAt;
    }

    public async Task<UnreadMessagesCountDto> GetUnreadCountAsync(Guid userId)
    {
        var count = await _conversationRepository.GetUnreadCountAsync(userId);
        return new UnreadMessagesCountDto { Count = count };
    }

    private async Task EnsureParticipantAsync(Guid userId, Guid conversationId)
    {
        var conversation = await _conversationRepository.GetByIdForUserAsync(conversationId, userId);
        if (conversation == null)
        {
            throw new UnauthorizedAccessException("Conversa não encontrada.");
        }
    }

    private async Task EnsureCanMessageAsync(Guid userId, Guid participantId)
    {
        var userFollowsOther = await _followRepository.IsFollowingAsync(userId, participantId);
        var otherFollowsUser = await _followRepository.IsFollowingAsync(participantId, userId);

        if (!userFollowsOther && !otherFollowsUser)
        {
            throw new UnauthorizedAccessException(
                "Só pode enviar mensagens a utilizadores que segue ou que o seguem.");
        }
    }

    private async Task<ConversationListItemDto> MapConversationAsync(Conversation conversation, Guid userId)
    {
        var otherParticipant = conversation.Participants.FirstOrDefault(p => p.UserId != userId)
            ?? throw new InvalidOperationException("Conversa inválida.");

        var otherUser = otherParticipant.User;
        var lastMessage = await _conversationRepository.GetLastMessageAsync(conversation.Id);

        var unreadCount = await _conversationRepository.GetUnreadCountForConversationAsync(conversation.Id, userId);

        return new ConversationListItemDto
        {
            Id = conversation.Id,
            OtherUserId = otherUser.Id,
            OtherUsername = otherUser.UserName ?? string.Empty,
            OtherDisplayName = otherUser.DisplayName,
            OtherPhotoUrl = otherUser.ProfilePhoto,
            LastMessageText = FormatMessagePreview(lastMessage),
            LastMessageAt = lastMessage?.CreatedAt,
            UnreadCount = unreadCount
        };
    }

    private static MessageResponseDto MapMessage(
        Message message,
        Guid currentUserId,
        DateTime? otherLastReadAt,
        IReadOnlyList<MessageReactionSummaryDto>? reactions)
    {
        var isMine = message.SenderId == currentUserId;
        var isRead = isMine &&
            otherLastReadAt.HasValue &&
            otherLastReadAt.Value >= message.CreatedAt;

        return new MessageResponseDto
        {
            Id = message.Id,
            ConversationId = message.ConversationId,
            SenderId = message.SenderId,
            SenderUsername = message.Sender.UserName ?? string.Empty,
            SenderDisplayName = message.Sender.DisplayName,
            SenderPhotoUrl = message.Sender.ProfilePhoto,
            Text = message.Text,
            ImageUrl = message.ImagePath,
            VideoUrl = message.VideoPath,
            IsGif = IsGifPath(message.ImagePath),
            ReplyTo = message.ReplyTo == null ? null : MapReplyPreview(message.ReplyTo),
            Reactions = reactions ?? Array.Empty<MessageReactionSummaryDto>(),
            CreatedAt = message.CreatedAt,
            IsMine = isMine,
            IsRead = isRead
        };
    }

    private static MessageReplyPreviewDto MapReplyPreview(Message message)
    {
        return new MessageReplyPreviewDto
        {
            Id = message.Id,
            SenderId = message.SenderId,
            SenderUsername = message.Sender.UserName ?? string.Empty,
            SenderDisplayName = message.Sender.DisplayName,
            Text = message.Text,
            ImageUrl = message.ImagePath,
            VideoUrl = message.VideoPath,
            IsGif = IsGifPath(message.ImagePath)
        };
    }

    private static Dictionary<Guid, IReadOnlyList<MessageReactionSummaryDto>> BuildReactionSummaries(
        IReadOnlyList<MessageReaction> reactions,
        Guid currentUserId)
    {
        return reactions
            .GroupBy(r => r.MessageId)
            .ToDictionary(
                group => group.Key,
                group => (IReadOnlyList<MessageReactionSummaryDto>)group
                    .GroupBy(r => r.Emoji)
                    .Select(emojiGroup => new MessageReactionSummaryDto
                    {
                        Emoji = emojiGroup.Key,
                        Count = emojiGroup.Count(),
                        ReactedByMe = emojiGroup.Any(r => r.UserId == currentUserId)
                    })
                    .OrderByDescending(summary => summary.Count)
                    .ToList());
    }

    private static bool IsGifPath(string? path)
    {
        return !string.IsNullOrWhiteSpace(path) &&
            path.EndsWith(".gif", StringComparison.OrdinalIgnoreCase);
    }

    private static string? FormatMessagePreview(Message? message)
    {
        if (message == null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(message.VideoPath) && string.IsNullOrWhiteSpace(message.Text))
        {
            return "Vídeo";
        }

        if (!string.IsNullOrWhiteSpace(message.ImagePath) && string.IsNullOrWhiteSpace(message.Text))
        {
            return IsGifPath(message.ImagePath) ? "GIF" : "Imagem";
        }

        if (message.ReplyToMessageId.HasValue && string.IsNullOrWhiteSpace(message.Text))
        {
            return "Resposta";
        }

        return message.Text;
    }
}

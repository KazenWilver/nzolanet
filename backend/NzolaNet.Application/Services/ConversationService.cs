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
    private const int MessageEditDeleteWindowMinutesValue = 15;

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

    public int MessageEditDeleteWindowMinutes => MessageEditDeleteWindowMinutesValue;

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

    public async Task<ConversationDetailDto> GetConversationAsync(Guid userId, Guid conversationId)
    {
        await EnsureParticipantAsync(userId, conversationId);

        var conversation = await _conversationRepository.GetByIdForUserAsync(conversationId, userId);
        if (conversation == null)
        {
            throw new UnauthorizedAccessException("Conversa não encontrada.");
        }

        return await MapConversationDetailAsync(conversation, userId);
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

    public async Task<ConversationListItemDto> CreateGroupConversationAsync(Guid userId, CreateGroupConversationDto dto)
    {
        var title = dto.Title?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException("O título do grupo é obrigatório.");
        }

        var participantIds = (dto.ParticipantIds ?? Array.Empty<Guid>())
            .Where(id => id != Guid.Empty && id != userId)
            .Distinct()
            .ToList();

        if (participantIds.Count == 0)
        {
            throw new ArgumentException("Seleciona pelo menos um participante.");
        }

        foreach (var participantId in participantIds)
        {
            var participant = await _userRepository.GetByIdAsync(participantId);
            if (participant == null)
            {
                throw new ArgumentException("Um dos participantes não foi encontrado.");
            }
        }

        var conversation = await _conversationRepository.CreateGroupConversationAsync(userId, title, participantIds);
        foreach (var participantId in participantIds)
        {
            await _notificationService.TryCreateGroupAddedNotificationAsync(
                userId,
                conversation.Id,
                participantId);
        }

        return await MapConversationAsync(conversation, userId);
    }

    public async Task<ConversationDetailDto> AddGroupParticipantsAsync(
        Guid userId,
        Guid conversationId,
        IReadOnlyList<Guid> participantIds)
    {
        await EnsureParticipantAsync(userId, conversationId);

        var conversation = await _conversationRepository.GetByIdForUserAsync(conversationId, userId);
        if (conversation == null || !conversation.IsGroup)
        {
            throw new ArgumentException("Conversa de grupo não encontrada.");
        }

        var newParticipantIds = participantIds
            .Where(id => id != Guid.Empty && id != userId)
            .Distinct()
            .ToList();

        if (newParticipantIds.Count == 0)
        {
            throw new ArgumentException("Seleciona pelo menos um participante.");
        }

        foreach (var participantId in newParticipantIds)
        {
            var participant = await _userRepository.GetByIdAsync(participantId);
            if (participant == null)
            {
                throw new ArgumentException("Um dos participantes não foi encontrado.");
            }
        }

        var added = await _conversationRepository.AddParticipantsAsync(conversationId, newParticipantIds);
        if (!added)
        {
            throw new ArgumentException("Não foi possível adicionar participantes.");
        }

        foreach (var participantId in newParticipantIds)
        {
            await _notificationService.TryCreateGroupAddedNotificationAsync(userId, conversationId, participantId);
        }

        var reloaded = await _conversationRepository.GetByIdForUserAsync(conversationId, userId)
            ?? conversation;
        return await MapConversationDetailAsync(reloaded, userId);
    }

    public async Task<ConversationDetailDto> UpdateGroupAsync(
        Guid userId,
        Guid conversationId,
        UpdateGroupConversationDto dto,
        IFormFile? image = null)
    {
        await EnsureParticipantAsync(userId, conversationId);

        var conversation = await _conversationRepository.GetByIdForUserAsync(conversationId, userId);
        if (conversation == null || !conversation.IsGroup)
        {
            throw new ArgumentException("Conversa de grupo não encontrada.");
        }

        string? imagePath = null;
        if (image is { Length: > 0 })
        {
            FileHelper.ValidateImageFile(image);
            imagePath = await _storageService.SaveFileAsync(image, "uploads/groups");
        }

        var updated = await _conversationRepository.UpdateGroupAsync(
            conversationId,
            dto.Title,
            dto.Description,
            imagePath);

        if (!updated)
        {
            throw new ArgumentException("Não foi possível atualizar o grupo.");
        }

        var reloaded = await _conversationRepository.GetByIdForUserAsync(conversationId, userId)
            ?? conversation;
        return await MapConversationDetailAsync(reloaded, userId);
    }

    public async Task<IEnumerable<MessageResponseDto>> GetMessagesAsync(
        Guid userId,
        Guid conversationId,
        int limit = 50,
        DateTime? before = null)
    {
        await EnsureParticipantAsync(userId, conversationId);

        var safeLimit = Math.Clamp(limit, 1, MaxMessagesPageSize);
        var messages = (await _conversationRepository.GetMessagesAsync(conversationId, userId, safeLimit, before)).ToList();
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
        Guid? replyToMessageId = null,
        string? remoteImageUrl = null)
    {
        await EnsureParticipantAsync(userId, conversationId);

        var trimmed = text?.Trim() ?? string.Empty;
        var hasImage = image is { Length: > 0 };
        var hasVideo = video is { Length: > 0 };
        var normalizedRemoteImageUrl = NormalizeRemoteImageUrl(remoteImageUrl);
        var hasRemoteImage = !string.IsNullOrWhiteSpace(normalizedRemoteImageUrl);

        if (string.IsNullOrWhiteSpace(trimmed) && !hasImage && !hasVideo && !hasRemoteImage)
        {
            throw new ArgumentException("A mensagem não pode estar vazia.");
        }

        if (trimmed.Length > MaxMessageLength)
        {
            throw new ArgumentException($"A mensagem não pode exceder {MaxMessageLength} caracteres.");
        }

        var mediaCount = (hasImage ? 1 : 0) + (hasVideo ? 1 : 0) + (hasRemoteImage ? 1 : 0);
        if (mediaCount > 1)
        {
            throw new ArgumentException("Envia apenas uma imagem, um vídeo ou um URL de imagem por mensagem.");
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
            CreatedAt = DateTime.UtcNow,
            RemoteImageUrl = normalizedRemoteImageUrl
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

    public async Task<MessageResponseDto> EditMessageAsync(
        Guid userId,
        Guid conversationId,
        Guid messageId,
        string text)
    {
        await EnsureParticipantAsync(userId, conversationId);

        var message = await _conversationRepository.GetMessageByIdAsync(messageId, conversationId);
        if (message == null)
        {
            throw new ArgumentException("Mensagem não encontrada.");
        }

        if (message.SenderId != userId)
        {
            throw new UnauthorizedAccessException("Só o remetente pode editar a mensagem.");
        }

        if (message.IsDeletedForEveryone)
        {
            throw new ArgumentException("Não é possível editar uma mensagem apagada para todos.");
        }

        if (!CanEditOrDeleteForEveryone(message.CreatedAt))
        {
            throw new ArgumentException($"Só podes editar mensagens até {MessageEditDeleteWindowMinutesValue} minutos após o envio.");
        }

        var trimmed = text?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            throw new ArgumentException("A mensagem não pode estar vazia.");
        }

        if (trimmed.Length > MaxMessageLength)
        {
            throw new ArgumentException($"A mensagem não pode exceder {MaxMessageLength} caracteres.");
        }

        message.Text = trimmed;
        message.EditedAt = DateTime.UtcNow;
        await _conversationRepository.UpdateMessageAsync(message);

        var reloaded = await _conversationRepository.GetMessageByIdAsync(messageId, conversationId)
            ?? message;
        var otherLastRead = await _conversationRepository.GetOtherParticipantLastReadAtAsync(conversationId, userId);
        var reactions = await _messageReactionRepository.GetByMessageIdsAsync(new[] { messageId });
        var mappedReactions = BuildReactionSummaries(reactions, userId).GetValueOrDefault(messageId)
            ?? Array.Empty<MessageReactionSummaryDto>();

        return MapMessage(reloaded, userId, otherLastRead, mappedReactions);
    }

    public async Task DeleteMessageAsync(
        Guid userId,
        Guid conversationId,
        Guid messageId,
        string scope)
    {
        await EnsureParticipantAsync(userId, conversationId);

        var normalizedScope = scope.Trim().ToLowerInvariant();
        if (normalizedScope is not ("self" or "everyone"))
        {
            throw new ArgumentException("Escopo inválido. Usa 'self' ou 'everyone'.");
        }

        var message = await _conversationRepository.GetMessageByIdAsync(messageId, conversationId);
        if (message == null)
        {
            throw new ArgumentException("Mensagem não encontrada.");
        }

        if (normalizedScope == "self")
        {
            await _conversationRepository.HideMessageForUserAsync(messageId, userId);
            return;
        }

        if (message.SenderId != userId)
        {
            throw new UnauthorizedAccessException("Só o remetente pode apagar para todos.");
        }

        if (!CanEditOrDeleteForEveryone(message.CreatedAt))
        {
            throw new ArgumentException($"Só podes apagar para todos até {MessageEditDeleteWindowMinutesValue} minutos após o envio.");
        }

        message.IsDeletedForEveryone = true;
        message.DeletedForEveryoneAt = DateTime.UtcNow;
        message.Text = string.Empty;
        message.ImagePath = null;
        message.VideoPath = null;
        message.RemoteImageUrl = null;
        await _conversationRepository.UpdateMessageAsync(message);
    }

    public async Task<IReadOnlyList<MessageResponseDto>> ForwardMessageAsync(
        Guid userId,
        Guid sourceConversationId,
        Guid messageId,
        IReadOnlyList<Guid> targetConversationIds)
    {
        await EnsureParticipantAsync(userId, sourceConversationId);

        var sourceMessage = await _conversationRepository.GetMessageByIdAsync(messageId, sourceConversationId);
        if (sourceMessage == null)
        {
            throw new ArgumentException("Mensagem de origem não encontrada.");
        }

        var targetIds = targetConversationIds
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();

        if (targetIds.Count == 0)
        {
            throw new ArgumentException("Seleciona pelo menos uma conversa de destino.");
        }

        foreach (var targetId in targetIds)
        {
            if (!await _conversationRepository.IsParticipantAsync(targetId, userId))
            {
                throw new UnauthorizedAccessException("Não participas numa das conversas de destino.");
            }
        }

        var now = DateTime.UtcNow;
        var messages = targetIds.Select(targetId => new Message
        {
            ConversationId = targetId,
            SenderId = userId,
            Text = sourceMessage.Text,
            ImagePath = sourceMessage.ImagePath,
            VideoPath = sourceMessage.VideoPath,
            RemoteImageUrl = sourceMessage.RemoteImageUrl,
            ReplyToMessageId = null,
            ForwardedFromMessageId = sourceMessage.Id,
            CreatedAt = now
        }).ToList();

        var savedMessages = await _conversationRepository.AddMessagesAsync(messages);
        var response = new List<MessageResponseDto>(savedMessages.Count);

        foreach (var savedMessage in savedMessages)
        {
            var otherLastRead = await _conversationRepository.GetOtherParticipantLastReadAtAsync(savedMessage.ConversationId, userId);
            var mapped = MapMessage(savedMessage, userId, otherLastRead, Array.Empty<MessageReactionSummaryDto>());
            response.Add(mapped);

            var recipients = await _conversationRepository.GetOtherParticipantIdsAsync(savedMessage.ConversationId, userId);
            var preview = FormatMessagePreview(savedMessage);
            foreach (var recipientId in recipients)
            {
                await _notificationService.TryCreateMessageNotificationAsync(
                    userId,
                    savedMessage.ConversationId,
                    recipientId,
                    preview);
            }
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

    private async Task<ConversationDetailDto> MapConversationDetailAsync(Conversation conversation, Guid userId)
    {
        var listItem = await MapConversationAsync(conversation, userId);
        var participants = conversation.Participants
            .OrderBy(participant => participant.User.DisplayName ?? participant.User.UserName)
            .Select(participant => new ConversationParticipantDto
            {
                UserId = participant.UserId,
                Username = participant.User.UserName ?? string.Empty,
                DisplayName = participant.User.DisplayName,
                PhotoUrl = participant.User.ProfilePhoto
            })
            .ToList();

        return new ConversationDetailDto
        {
            Id = listItem.Id,
            OtherUserId = listItem.OtherUserId,
            OtherUsername = listItem.OtherUsername,
            OtherDisplayName = listItem.OtherDisplayName,
            OtherPhotoUrl = listItem.OtherPhotoUrl,
            Title = listItem.Title,
            Description = conversation.Description,
            ImageUrl = conversation.ImagePath,
            IsGroup = listItem.IsGroup,
            ParticipantCount = listItem.ParticipantCount,
            LastMessageText = listItem.LastMessageText,
            LastMessageAt = listItem.LastMessageAt,
            UnreadCount = listItem.UnreadCount,
            Participants = participants
        };
    }

    private async Task<ConversationListItemDto> MapConversationAsync(Conversation conversation, Guid userId)
    {
        var lastMessage = await _conversationRepository.GetLastMessageAsync(conversation.Id);
        var participantCount = await _conversationRepository.GetParticipantsCountAsync(conversation.Id);
        var unreadCount = await _conversationRepository.GetUnreadCountForConversationAsync(conversation.Id, userId);

        if (conversation.IsGroup)
        {
            return new ConversationListItemDto
            {
                Id = conversation.Id,
                Title = conversation.Title,
                Description = conversation.Description,
                ImageUrl = conversation.ImagePath,
                IsGroup = true,
                ParticipantCount = participantCount,
                LastMessageText = FormatMessagePreview(lastMessage),
                LastMessageAt = lastMessage?.CreatedAt,
                UnreadCount = unreadCount
            };
        }

        var otherParticipant = conversation.Participants.FirstOrDefault(p => p.UserId != userId)
            ?? throw new InvalidOperationException("Conversa inválida.");
        var otherUser = otherParticipant.User;

        return new ConversationListItemDto
        {
            Id = conversation.Id,
            OtherUserId = otherUser.Id,
            OtherUsername = otherUser.UserName ?? string.Empty,
            OtherDisplayName = otherUser.DisplayName,
            OtherPhotoUrl = otherUser.ProfilePhoto,
            IsGroup = false,
            ParticipantCount = participantCount,
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
            ImageUrl = message.RemoteImageUrl ?? message.ImagePath,
            VideoUrl = message.VideoPath,
            RemoteImageUrl = message.RemoteImageUrl,
            ForwardedFromMessageId = message.ForwardedFromMessageId,
            IsEdited = message.EditedAt.HasValue,
            IsDeletedForEveryone = message.IsDeletedForEveryone,
            IsGif = IsGifPath(message.RemoteImageUrl ?? message.ImagePath),
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
            ImageUrl = message.RemoteImageUrl ?? message.ImagePath,
            VideoUrl = message.VideoPath,
            IsGif = IsGifPath(message.RemoteImageUrl ?? message.ImagePath)
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

        if (message.IsDeletedForEveryone)
        {
            return "Mensagem apagada";
        }

        if (!string.IsNullOrWhiteSpace(message.VideoPath) && string.IsNullOrWhiteSpace(message.Text))
        {
            return "Vídeo";
        }

        var imagePath = message.RemoteImageUrl ?? message.ImagePath;
        if (!string.IsNullOrWhiteSpace(imagePath) && string.IsNullOrWhiteSpace(message.Text))
        {
            return IsGifPath(imagePath) ? "GIF" : "Imagem";
        }

        if (message.ReplyToMessageId.HasValue && string.IsNullOrWhiteSpace(message.Text))
        {
            return "Resposta";
        }

        return message.Text;
    }

    private static string? NormalizeRemoteImageUrl(string? remoteImageUrl)
    {
        var value = remoteImageUrl?.Trim();
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new ArgumentException("O URL da imagem remota deve usar http ou https.");
        }

        return uri.ToString();
    }

    private static bool CanEditOrDeleteForEveryone(DateTime createdAt)
    {
        var deadline = createdAt.AddMinutes(MessageEditDeleteWindowMinutesValue);
        return DateTime.UtcNow <= deadline;
    }
}

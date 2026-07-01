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
    private readonly IUserRepository _userRepository;
    private readonly IFollowRepository _followRepository;
    private readonly IStorageService _storageService;
    private readonly INotificationService _notificationService;

    public ConversationService(
        IConversationRepository conversationRepository,
        IUserRepository userRepository,
        IFollowRepository followRepository,
        IStorageService storageService,
        INotificationService notificationService)
    {
        _conversationRepository = conversationRepository;
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
        var messages = await _conversationRepository.GetMessagesAsync(conversationId, safeLimit, before);
        var otherLastRead = await _conversationRepository.GetOtherParticipantLastReadAtAsync(conversationId, userId);

        return messages.Select(message => MapMessage(message, userId, otherLastRead));
    }

    public async Task<MessageResponseDto> SendMessageAsync(
        Guid userId,
        Guid conversationId,
        string? text,
        IFormFile? image = null)
    {
        await EnsureParticipantAsync(userId, conversationId);

        var trimmed = text?.Trim() ?? string.Empty;
        var hasImage = image is { Length: > 0 };

        if (string.IsNullOrWhiteSpace(trimmed) && !hasImage)
        {
            throw new ArgumentException("A mensagem não pode estar vazia.");
        }

        if (trimmed.Length > MaxMessageLength)
        {
            throw new ArgumentException($"A mensagem não pode exceder {MaxMessageLength} caracteres.");
        }

        if (hasImage)
        {
            FileHelper.ValidateImageFile(image!);
        }

        var message = new Message
        {
            ConversationId = conversationId,
            SenderId = userId,
            Text = trimmed,
            CreatedAt = DateTime.UtcNow
        };

        if (hasImage)
        {
            message.ImagePath = await _storageService.SaveFileAsync(image!, "messages");
        }

        var saved = await _conversationRepository.AddMessageAsync(message);
        var otherLastRead = await _conversationRepository.GetOtherParticipantLastReadAtAsync(conversationId, userId);
        var response = MapMessage(saved, userId, otherLastRead);

        var preview = FormatMessagePreview(saved);
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

    private static MessageResponseDto MapMessage(Message message, Guid currentUserId, DateTime? otherLastReadAt)
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
            CreatedAt = message.CreatedAt,
            IsMine = isMine,
            IsRead = isRead
        };
    }

    private static string? FormatMessagePreview(Message? message)
    {
        if (message == null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(message.ImagePath) && string.IsNullOrWhiteSpace(message.Text))
        {
            return "Imagem";
        }

        if (!string.IsNullOrWhiteSpace(message.ImagePath) && !string.IsNullOrWhiteSpace(message.Text))
        {
            return message.Text;
        }

        return message.Text;
    }
}

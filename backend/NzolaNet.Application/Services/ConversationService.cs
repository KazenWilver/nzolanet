using NzolaNet.Application.DTOs.Conversations;
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

    public ConversationService(
        IConversationRepository conversationRepository,
        IUserRepository userRepository,
        IFollowRepository followRepository)
    {
        _conversationRepository = conversationRepository;
        _userRepository = userRepository;
        _followRepository = followRepository;
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

        return messages.Select(message => MapMessage(message, userId));
    }

    public async Task<MessageResponseDto> SendMessageAsync(Guid userId, Guid conversationId, string text)
    {
        await EnsureParticipantAsync(userId, conversationId);

        var trimmed = text?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            throw new ArgumentException("A mensagem não pode estar vazia.");
        }

        if (trimmed.Length > MaxMessageLength)
        {
            throw new ArgumentException($"A mensagem não pode exceder {MaxMessageLength} caracteres.");
        }

        var message = new Message
        {
            ConversationId = conversationId,
            SenderId = userId,
            Text = trimmed,
            CreatedAt = DateTime.UtcNow
        };

        var saved = await _conversationRepository.AddMessageAsync(message);
        return MapMessage(saved, userId);
    }

    public async Task MarkAsReadAsync(Guid userId, Guid conversationId)
    {
        await EnsureParticipantAsync(userId, conversationId);
        await _conversationRepository.MarkAsReadAsync(conversationId, userId, DateTime.UtcNow);
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
        var lastMessage = conversation.Messages
            .Where(m => !m.IsDeleted)
            .OrderByDescending(m => m.CreatedAt)
            .FirstOrDefault();

        var unreadCount = await _conversationRepository.GetUnreadCountForConversationAsync(conversation.Id, userId);

        return new ConversationListItemDto
        {
            Id = conversation.Id,
            OtherUserId = otherUser.Id,
            OtherUsername = otherUser.UserName ?? string.Empty,
            OtherDisplayName = otherUser.DisplayName,
            OtherPhotoUrl = otherUser.ProfilePhoto,
            LastMessageText = lastMessage?.Text,
            LastMessageAt = lastMessage?.CreatedAt,
            UnreadCount = unreadCount
        };
    }

    private static MessageResponseDto MapMessage(Message message, Guid currentUserId)
    {
        return new MessageResponseDto
        {
            Id = message.Id,
            ConversationId = message.ConversationId,
            SenderId = message.SenderId,
            SenderUsername = message.Sender.UserName ?? string.Empty,
            SenderDisplayName = message.Sender.DisplayName,
            SenderPhotoUrl = message.Sender.ProfilePhoto,
            Text = message.Text,
            CreatedAt = message.CreatedAt,
            IsMine = message.SenderId == currentUserId
        };
    }
}

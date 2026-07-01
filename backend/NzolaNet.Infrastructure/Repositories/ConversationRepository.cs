using Microsoft.EntityFrameworkCore;
using NzolaNet.Application.Helpers;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;
using NzolaNet.Infrastructure.Data;

namespace NzolaNet.Infrastructure.Repositories;

public class ConversationRepository : IConversationRepository
{
    private readonly ApplicationDbContext _context;

    public ConversationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Conversation>> GetByUserIdAsync(Guid userId)
    {
        return await _context.Conversations
            .AsNoTracking()
            .Include(c => c.Participants)
                .ThenInclude(p => p.User)
            .Where(c => c.Participants.Any(p => p.UserId == userId))
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync();
    }

    public async Task<Conversation?> GetByIdForUserAsync(Guid conversationId, Guid userId)
    {
        return await _context.Conversations
            .Include(c => c.Participants)
                .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(c =>
                c.Id == conversationId &&
                c.Participants.Any(p => p.UserId == userId));
    }

    public async Task<Conversation?> FindDirectConversationAsync(Guid userId, Guid otherUserId)
    {
        return await _context.Conversations
            .Include(c => c.Participants)
                .ThenInclude(p => p.User)
            .Where(c =>
                c.Participants.Count == 2 &&
                c.Participants.Any(p => p.UserId == userId) &&
                c.Participants.Any(p => p.UserId == otherUserId))
            .FirstOrDefaultAsync();
    }

    public async Task<Conversation> CreateDirectConversationAsync(Guid userId, Guid otherUserId)
    {
        var conversation = new Conversation
        {
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Participants = new List<ConversationParticipant>
            {
                new() { UserId = userId, JoinedAt = DateTime.UtcNow },
                new() { UserId = otherUserId, JoinedAt = DateTime.UtcNow }
            }
        };

        _context.Conversations.Add(conversation);
        await _context.SaveChangesAsync();

        return await GetByIdForUserAsync(conversation.Id, userId)
            ?? conversation;
    }

    public async Task<Conversation> CreateGroupConversationAsync(
        Guid creatorUserId,
        string title,
        IReadOnlyCollection<Guid> participantIds)
    {
        var distinctParticipants = participantIds
            .Where(id => id != Guid.Empty && id != creatorUserId)
            .Distinct()
            .ToList();

        var orderedParticipants = new List<Guid> { creatorUserId };
        orderedParticipants.AddRange(distinctParticipants);

        var now = DateTime.UtcNow;
        var conversation = new Conversation
        {
            Title = title,
            IsGroup = true,
            CreatedAt = now,
            UpdatedAt = now,
            Participants = orderedParticipants.Select(participantId => new ConversationParticipant
            {
                UserId = participantId,
                JoinedAt = now
            }).ToList()
        };

        _context.Conversations.Add(conversation);
        await _context.SaveChangesAsync();

        return await _context.Conversations
            .AsNoTracking()
            .Include(c => c.Participants)
                .ThenInclude(p => p.User)
            .FirstAsync(c => c.Id == conversation.Id);
    }

    public async Task<Message> AddMessageAsync(Message message)
    {
        _context.Messages.Add(message);

        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(c => c.Id == message.ConversationId);

        if (conversation != null)
        {
            conversation.UpdatedAt = message.CreatedAt;
        }

        await _context.SaveChangesAsync();

        return await _context.Messages
            .Include(m => m.Sender)
            .FirstAsync(m => m.Id == message.Id);
    }

    public async Task<IReadOnlyList<Message>> AddMessagesAsync(IEnumerable<Message> messages)
    {
        var messageList = messages.ToList();
        if (messageList.Count == 0)
        {
            return Array.Empty<Message>();
        }

        _context.Messages.AddRange(messageList);

        var latestByConversation = messageList
            .GroupBy(message => message.ConversationId)
            .Select(group => new
            {
                ConversationId = group.Key,
                UpdatedAt = group.Max(message => message.CreatedAt)
            })
            .ToList();

        var conversationIds = latestByConversation.Select(item => item.ConversationId).ToList();
        var conversations = await _context.Conversations
            .Where(conversation => conversationIds.Contains(conversation.Id))
            .ToListAsync();

        foreach (var conversation in conversations)
        {
            var entry = latestByConversation.First(item => item.ConversationId == conversation.Id);
            conversation.UpdatedAt = entry.UpdatedAt;
        }

        await _context.SaveChangesAsync();

        var createdIds = messageList.Select(message => message.Id).ToList();
        return await _context.Messages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Include(m => m.ReplyTo!)
                .ThenInclude(r => r.Sender)
            .Where(message => createdIds.Contains(message.Id))
            .OrderBy(message => message.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Message>> GetMessagesAsync(
        Guid conversationId,
        Guid? viewerUserId = null,
        int limit = 50,
        DateTime? before = null)
    {
        var query = _context.Messages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Include(m => m.ReplyTo!)
                .ThenInclude(r => r.Sender)
            .Where(m => m.ConversationId == conversationId && !m.IsDeleted);

        if (viewerUserId.HasValue)
        {
            var hiddenMessageIds = _context.MessageUserHides
                .AsNoTracking()
                .Where(hide => hide.UserId == viewerUserId.Value)
                .Select(hide => hide.MessageId);

            query = query.Where(message => !hiddenMessageIds.Contains(message.Id));
        }

        if (before.HasValue)
        {
            query = query.Where(m => m.CreatedAt < before.Value);
        }

        var messages = await query
            .OrderByDescending(m => m.CreatedAt)
            .Take(limit)
            .ToListAsync();

        messages.Reverse();
        return messages;
    }

    public async Task<Message?> GetLastMessageAsync(Guid conversationId)
    {
        return await _context.Messages
            .AsNoTracking()
            .Where(m => m.ConversationId == conversationId && !m.IsDeleted)
            .OrderByDescending(m => m.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<Message?> GetMessageByIdAsync(Guid messageId, Guid conversationId)
    {
        return await _context.Messages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Include(m => m.ReplyTo!)
                .ThenInclude(r => r.Sender)
            .FirstOrDefaultAsync(m =>
                m.Id == messageId &&
                m.ConversationId == conversationId &&
                !m.IsDeleted);
    }

    public async Task<bool> MarkAsReadAsync(Guid conversationId, Guid userId, DateTime readAt)
    {
        var participant = await _context.ConversationParticipants
            .FirstOrDefaultAsync(p => p.ConversationId == conversationId && p.UserId == userId);

        if (participant == null)
        {
            return false;
        }

        participant.LastReadAt = readAt;
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        var participants = await _context.ConversationParticipants
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .Select(p => new { p.ConversationId, p.LastReadAt })
            .ToListAsync();

        if (participants.Count == 0)
        {
            return 0;
        }

        var conversationIds = participants.Select(p => p.ConversationId).ToList();
        var lastMessages = await _context.Messages
            .AsNoTracking()
            .Where(m => conversationIds.Contains(m.ConversationId) && !m.IsDeleted && m.SenderId != userId)
            .GroupBy(m => m.ConversationId)
            .Select(g => new
            {
                ConversationId = g.Key,
                LastAt = g.Max(m => m.CreatedAt)
            })
            .ToListAsync();

        var unread = 0;

        foreach (var participant in participants)
        {
            var lastIncoming = lastMessages.FirstOrDefault(m => m.ConversationId == participant.ConversationId);
            if (lastIncoming == null)
            {
                continue;
            }

            if (!participant.LastReadAt.HasValue || participant.LastReadAt < lastIncoming.LastAt)
            {
                unread += await _context.Messages.CountAsync(m =>
                    m.ConversationId == participant.ConversationId &&
                    !m.IsDeleted &&
                    m.SenderId != userId &&
                    (!participant.LastReadAt.HasValue || m.CreatedAt > participant.LastReadAt));
            }
        }

        return unread;
    }

    public async Task<int> GetUnreadCountForConversationAsync(Guid conversationId, Guid userId)
    {
        var participant = await _context.ConversationParticipants
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ConversationId == conversationId && p.UserId == userId);

        if (participant == null)
        {
            return 0;
        }

        return await _context.Messages.CountAsync(m =>
            m.ConversationId == conversationId &&
            !m.IsDeleted &&
            m.SenderId != userId &&
            (!participant.LastReadAt.HasValue || m.CreatedAt > participant.LastReadAt));
    }

    public async Task<DateTime?> GetOtherParticipantLastReadAtAsync(Guid conversationId, Guid userId)
    {
        return await _context.ConversationParticipants
            .AsNoTracking()
            .Where(p => p.ConversationId == conversationId && p.UserId != userId)
            .Select(p => p.LastReadAt)
            .FirstOrDefaultAsync();
    }

    public async Task<IReadOnlyList<Guid>> GetOtherParticipantIdsAsync(Guid conversationId, Guid userId)
    {
        return await _context.ConversationParticipants
            .AsNoTracking()
            .Where(p => p.ConversationId == conversationId && p.UserId != userId)
            .Select(p => p.UserId)
            .ToListAsync();
    }

    public Task<int> GetParticipantsCountAsync(Guid conversationId)
    {
        return _context.ConversationParticipants.CountAsync(participant => participant.ConversationId == conversationId);
    }

    public Task<bool> IsParticipantAsync(Guid conversationId, Guid userId)
    {
        return _context.ConversationParticipants.AnyAsync(participant =>
            participant.ConversationId == conversationId &&
            participant.UserId == userId);
    }

    public Task<bool> IsMessageHiddenForUserAsync(Guid messageId, Guid userId)
    {
        return _context.MessageUserHides.AnyAsync(hide =>
            hide.MessageId == messageId &&
            hide.UserId == userId);
    }

    public async Task HideMessageForUserAsync(Guid messageId, Guid userId)
    {
        if (await IsMessageHiddenForUserAsync(messageId, userId))
        {
            return;
        }

        _context.MessageUserHides.Add(new MessageUserHide
        {
            MessageId = messageId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
    }

    public async Task UpdateMessageAsync(Message message)
    {
        _context.Messages.Update(message);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> AddParticipantsAsync(Guid conversationId, IReadOnlyCollection<Guid> participantIds)
    {
        var isGroup = await _context.Conversations
            .AsNoTracking()
            .AnyAsync(c => c.Id == conversationId && c.IsGroup);

        if (!isGroup)
        {
            return false;
        }

        var existingIds = await _context.ConversationParticipants
            .AsNoTracking()
            .Where(p => p.ConversationId == conversationId)
            .Select(p => p.UserId)
            .ToListAsync();

        var existingSet = existingIds.ToHashSet();
        var now = DateTime.UtcNow;
        var added = false;

        foreach (var participantId in participantIds.Distinct())
        {
            if (participantId == Guid.Empty || existingSet.Contains(participantId))
            {
                continue;
            }

            _context.ConversationParticipants.Add(new ConversationParticipant
            {
                ConversationId = conversationId,
                UserId = participantId,
                JoinedAt = now
            });
            added = true;
        }

        if (!added)
        {
            return false;
        }

        await _context.Conversations
            .Where(c => c.Id == conversationId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(c => c.UpdatedAt, now));

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateGroupAsync(
        Guid conversationId,
        string? title,
        string? description,
        string? imagePath)
    {
        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.IsGroup);

        if (conversation == null)
        {
            return false;
        }

        if (!string.IsNullOrWhiteSpace(title))
        {
            conversation.Title = title.Trim();
        }

        if (description != null)
        {
            conversation.Description = string.IsNullOrWhiteSpace(description)
                ? null
                : description.Trim();
        }

        if (imagePath != null)
        {
            conversation.ImagePath = string.IsNullOrWhiteSpace(imagePath) ? null : imagePath;
        }

        conversation.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public Task<Conversation?> GetByImagePathAsync(string imagePath)
    {
        return _context.Conversations
            .AsNoTracking()
            .Include(c => c.Participants)
            .FirstOrDefaultAsync(c => c.ImagePath == imagePath);
    }

    public async Task<Message?> GetByMediaPathAsync(string mediaPath)
    {
        var paths = MessageMediaPathHelper.GetEquivalentPaths(mediaPath);
        if (paths.Count == 0)
        {
            return null;
        }

        return await _context.Messages
            .AsNoTracking()
            .Include(m => m.Conversation)
                .ThenInclude(c => c.Participants)
            .FirstOrDefaultAsync(m =>
                (m.ImagePath != null && paths.Contains(m.ImagePath)) ||
                (m.VideoPath != null && paths.Contains(m.VideoPath)) ||
                (m.DocumentPath != null && paths.Contains(m.DocumentPath)) ||
                (m.AudioPath != null && paths.Contains(m.AudioPath)));
    }

    public async Task<Guid?> GetGroupCreatorUserIdAsync(Guid conversationId)
    {
        return await _context.ConversationParticipants
            .AsNoTracking()
            .Where(participant => participant.ConversationId == conversationId)
            .OrderBy(participant => participant.Id)
            .Select(participant => participant.UserId)
            .FirstOrDefaultAsync();
    }

    public async Task<bool> DeleteConversationAsync(Guid conversationId)
    {
        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(item => item.Id == conversationId);

        if (conversation == null)
        {
            return false;
        }

        var notifications = await _context.Notifications
            .Where(notification => notification.ConversationId == conversationId)
            .ToListAsync();

        if (notifications.Count > 0)
        {
            _context.Notifications.RemoveRange(notifications);
        }

        _context.Conversations.Remove(conversation);
        await _context.SaveChangesAsync();
        return true;
    }
}

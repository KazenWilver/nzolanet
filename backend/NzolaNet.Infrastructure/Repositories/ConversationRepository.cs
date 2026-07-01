using Microsoft.EntityFrameworkCore;
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

    public async Task<IEnumerable<Message>> GetMessagesAsync(
        Guid conversationId,
        int limit = 50,
        DateTime? before = null)
    {
        var query = _context.Messages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Where(m => m.ConversationId == conversationId && !m.IsDeleted);

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
}

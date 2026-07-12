using Microsoft.EntityFrameworkCore;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;
using NzolaNet.Infrastructure.Data;

namespace NzolaNet.Infrastructure.Repositories;

public class MessageReactionRepository : IMessageReactionRepository
{
    private readonly ApplicationDbContext _context;

    public MessageReactionRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<MessageReaction>> GetByMessageIdsAsync(IEnumerable<Guid> messageIds)
    {
        var ids = messageIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return Array.Empty<MessageReaction>();
        }

        return await _context.MessageReactions
            .AsNoTracking()
            .Where(r => ids.Contains(r.MessageId))
            .ToListAsync();
    }

    public async Task<MessageReaction?> GetByMessageAndUserAsync(Guid messageId, Guid userId)
    {
        return await _context.MessageReactions
            .FirstOrDefaultAsync(r => r.MessageId == messageId && r.UserId == userId);
    }

    public async Task<MessageReaction> CreateAsync(MessageReaction reaction)
    {
        _context.MessageReactions.Add(reaction);
        await _context.SaveChangesAsync();
        return reaction;
    }

    public async Task UpdateAsync(MessageReaction reaction)
    {
        _context.MessageReactions.Update(reaction);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(MessageReaction reaction)
    {
        _context.MessageReactions.Remove(reaction);
        await _context.SaveChangesAsync();
    }
}

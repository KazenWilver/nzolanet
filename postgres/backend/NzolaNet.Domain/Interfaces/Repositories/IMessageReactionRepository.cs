using NzolaNet.Domain.Entities;

namespace NzolaNet.Domain.Interfaces.Repositories;

public interface IMessageReactionRepository
{
    Task<IReadOnlyList<MessageReaction>> GetByMessageIdsAsync(IEnumerable<Guid> messageIds);
    Task<MessageReaction?> GetByMessageAndUserAsync(Guid messageId, Guid userId);
    Task<MessageReaction> CreateAsync(MessageReaction reaction);
    Task UpdateAsync(MessageReaction reaction);
    Task DeleteAsync(MessageReaction reaction);
}

using NzolaNet.Domain.Entities;

namespace NzolaNet.Domain.Interfaces.Repositories;

public interface IRepostRepository
{
    Task<bool> HasUserRepostedAsync(Guid userId, Guid postId);
    Task<int> GetRepostCountAsync(Guid postId);
    Task<Dictionary<Guid, int>> GetRepostCountsByPostIdsAsync(IEnumerable<Guid> postIds);
    Task<HashSet<Guid>> GetRepostedPostIdsForUserAsync(Guid userId, IEnumerable<Guid> postIds);
    Task<IReadOnlyList<Repost>> GetUserRepostsAsync(Guid userId);
    Task<Repost> CreateAsync(Repost repost);
    Task<bool> DeleteAsync(Guid userId, Guid postId);
}

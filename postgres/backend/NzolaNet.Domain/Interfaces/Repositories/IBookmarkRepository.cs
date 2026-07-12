using NzolaNet.Domain.Entities;

namespace NzolaNet.Domain.Interfaces.Repositories;

public interface IBookmarkRepository
{
    Task<Bookmark?> GetByUserAndPostAsync(Guid userId, Guid postId);
    Task CreateAsync(Bookmark bookmark);
    Task DeleteAsync(Bookmark bookmark);
    Task<Dictionary<Guid, int>> GetBookmarkCountsByPostIdsAsync(IReadOnlyCollection<Guid> postIds);
    Task<HashSet<Guid>> GetBookmarkedPostIdsForUserAsync(Guid userId, IReadOnlyCollection<Guid> postIds);
    Task<(IReadOnlyList<Post> Items, int TotalCount)> GetBookmarkedPostsByUserAsync(Guid userId, int page, int pageSize);
}

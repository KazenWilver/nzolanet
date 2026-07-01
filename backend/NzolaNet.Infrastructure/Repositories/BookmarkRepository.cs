using Microsoft.EntityFrameworkCore;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;
using NzolaNet.Infrastructure.Data;

namespace NzolaNet.Infrastructure.Repositories;

public class BookmarkRepository : IBookmarkRepository
{
    private readonly ApplicationDbContext _context;

    public BookmarkRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<Bookmark?> GetByUserAndPostAsync(Guid userId, Guid postId)
    {
        return _context.Bookmarks
            .FirstOrDefaultAsync(bookmark => bookmark.UserId == userId && bookmark.PostId == postId);
    }

    public async Task CreateAsync(Bookmark bookmark)
    {
        _context.Bookmarks.Add(bookmark);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Bookmark bookmark)
    {
        _context.Bookmarks.Remove(bookmark);
        await _context.SaveChangesAsync();
    }

    public async Task<Dictionary<Guid, int>> GetBookmarkCountsByPostIdsAsync(IReadOnlyCollection<Guid> postIds)
    {
        if (postIds.Count == 0)
        {
            return new Dictionary<Guid, int>();
        }

        return await _context.Bookmarks
            .AsNoTracking()
            .Where(bookmark => postIds.Contains(bookmark.PostId))
            .GroupBy(bookmark => bookmark.PostId)
            .ToDictionaryAsync(group => group.Key, group => group.Count());
    }

    public async Task<HashSet<Guid>> GetBookmarkedPostIdsForUserAsync(Guid userId, IReadOnlyCollection<Guid> postIds)
    {
        if (postIds.Count == 0)
        {
            return new HashSet<Guid>();
        }

        var ids = await _context.Bookmarks
            .AsNoTracking()
            .Where(bookmark => bookmark.UserId == userId && postIds.Contains(bookmark.PostId))
            .Select(bookmark => bookmark.PostId)
            .ToListAsync();

        return ids.ToHashSet();
    }

    public async Task<(IReadOnlyList<Post> Items, int TotalCount)> GetBookmarkedPostsByUserAsync(
        Guid userId,
        int page,
        int pageSize)
    {
        var query = _context.Bookmarks
            .AsNoTracking()
            .Where(bookmark => bookmark.UserId == userId)
            .OrderByDescending(bookmark => bookmark.CreatedAt)
            .Select(bookmark => bookmark.Post)
            .Include(post => post.User);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }
}

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
        var bookmarkQuery = _context.Bookmarks
            .AsNoTracking()
            .Where(bookmark => bookmark.UserId == userId);

        var totalCount = await bookmarkQuery.CountAsync();

        var bookmarkEntries = await bookmarkQuery
            .OrderByDescending(bookmark => bookmark.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(bookmark => new { bookmark.PostId })
            .ToListAsync();

        if (bookmarkEntries.Count == 0)
        {
            return (Array.Empty<Post>(), totalCount);
        }

        var postIds = bookmarkEntries.Select(entry => entry.PostId).ToList();

        var posts = await _context.Posts
            .AsNoTracking()
            .Include(post => post.User)
            .Where(post => postIds.Contains(post.Id))
            .ToListAsync();

        var postsById = posts.ToDictionary(post => post.Id);
        var items = bookmarkEntries
            .Where(entry => postsById.ContainsKey(entry.PostId))
            .Select(entry => postsById[entry.PostId])
            .ToList();

        return (items, totalCount);
    }
}

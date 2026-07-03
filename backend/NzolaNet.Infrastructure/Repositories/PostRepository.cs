using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;
using NzolaNet.Infrastructure.Data;

namespace NzolaNet.Infrastructure.Repositories;

public class PostRepository : IPostRepository
{
    private static readonly Regex HashtagRegex = new(
        @"#([A-Za-z0-9_\u00C0-\u024F]+)",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private readonly ApplicationDbContext _context;

    public PostRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Post?> GetByIdAsync(Guid id)
    {
        return await _context.Posts
            .Include(p => p.User)
            .Include(p => p.QuotedPost!)
                .ThenInclude(quoted => quoted.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<IEnumerable<Post>> GetAllAsync()
    {
        return await _context.Posts
            .Include(p => p.User)
            .OrderByDescending(p => p.CreatedAt)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<(IEnumerable<Post> Items, int TotalCount)> GetAllVisiblePagedAsync(
        int page,
        int pageSize,
        Guid? currentUserId,
        IReadOnlyCollection<Guid> followedUserIds)
    {
        var query = ApplyVisibilityFilter(
            _context.Posts
                .Include(p => p.User)
                .Include(p => p.QuotedPost!)
                    .ThenInclude(quoted => quoted.User),
            currentUserId,
            followedUserIds);

        query = query.OrderByDescending(p => p.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<Post?> GetByMediaPathAsync(string mediaPath)
    {
        return await _context.Posts
            .Include(p => p.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ImagePath == mediaPath || p.VideoPath == mediaPath);
    }

    public async Task<IEnumerable<Post>> GetFeedByFollowedUsersAsync(IEnumerable<Guid> followedUserIds)
    {
        return await _context.Posts
            .Include(p => p.User)
            .Where(p => followedUserIds.Contains(p.UserId))
            .OrderByDescending(p => p.CreatedAt)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<(IEnumerable<Post> Items, int TotalCount)> GetFeedByFollowedUsersPagedAsync(
        IEnumerable<Guid> followedUserIds,
        int page,
        int pageSize)
    {
        var query = _context.Posts
            .Include(p => p.User)
            .Include(p => p.QuotedPost!)
                .ThenInclude(quoted => quoted.User)
            .Where(p => followedUserIds.Contains(p.UserId))
            .OrderByDescending(p => p.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<IEnumerable<Post>> GetByUserIdAsync(Guid userId)
    {
        return await _context.Posts
            .Include(p => p.User)
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<(IEnumerable<Post> Items, int TotalCount)> GetByUserIdPagedAsync(
        Guid userId,
        int page,
        int pageSize,
        bool mediaOnly = false)
    {
        IQueryable<Post> query = _context.Posts
            .Include(p => p.User)
            .Where(p => p.UserId == userId);

        if (mediaOnly)
        {
            query = query.Where(p => p.ImagePath != null || p.VideoPath != null);
        }

        query = query.OrderByDescending(p => p.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<(IEnumerable<Post> Items, int TotalCount)> SearchByHashtagAsync(string tag, int page, int pageSize)
    {
        var normalizedTag = tag.Trim().TrimStart('#');
        if (string.IsNullOrWhiteSpace(normalizedTag))
        {
            return (Array.Empty<Post>(), 0);
        }

        var pattern = $"%#{normalizedTag}%";

        var query = _context.Posts
            .Include(p => p.User)
            .Include(p => p.QuotedPost!)
                .ThenInclude(quoted => quoted.User)
            .Where(p => !string.IsNullOrWhiteSpace(p.Text) && EF.Functions.Like(p.Text, pattern))
            .OrderByDescending(p => p.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<IEnumerable<string>> GetRecentPostTextsAsync(int limit)
    {
        return await _context.Posts
            .AsNoTracking()
            .Include(post => post.User)
            .Where(post => !string.IsNullOrWhiteSpace(post.Text) && !post.User.IsPrivate)
            .OrderByDescending(post => post.CreatedAt)
            .Take(limit)
            .Select(post => post.Text)
            .ToListAsync();
    }

    public async Task<(IEnumerable<Post> Items, int TotalCount)> GetQuotedRepostsByUserPagedAsync(
        Guid userId,
        int page,
        int pageSize)
    {
        var query = _context.Posts
            .AsNoTracking()
            .Include(post => post.User)
            .Include(post => post.QuotedPost!)
                .ThenInclude(quoted => quoted.User)
            .Where(post => post.UserId == userId && post.QuotedPostId != null)
            .OrderByDescending(post => post.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<IReadOnlyList<Post>> GetQuotedPostsByUserAndSourceAsync(Guid userId, Guid quotedPostId)
    {
        return await _context.Posts
            .Include(post => post.User)
            .Include(post => post.QuotedPost!)
                .ThenInclude(quoted => quoted.User)
            .Where(post => post.UserId == userId && post.QuotedPostId == quotedPostId)
            .OrderByDescending(post => post.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> CreateAsync(Post post)
    {
        _context.Posts.Add(post);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> UpdateAsync(Post post)
    {
        _context.Posts.Update(post);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteAsync(Post post)
    {
        _context.Posts.Remove(post);
        return await _context.SaveChangesAsync() > 0;
    }

    public Task<int> GetTotalCountAsync()
    {
        return _context.Posts.CountAsync();
    }

    public Task<int> GetTotalWithImageAsync()
    {
        return _context.Posts.CountAsync(post => post.ImagePath != null && post.ImagePath != "");
    }

    public Task<int> GetTotalWithVideoAsync()
    {
        return _context.Posts.CountAsync(post => post.VideoPath != null && post.VideoPath != "");
    }

    public async Task<int> GetTotalCreatedHashtagsAsync(DateTime? sinceUtc = null)
    {
        var query = _context.Posts
            .AsNoTracking()
            .Where(post => !string.IsNullOrWhiteSpace(post.Text))
            .Select(post => new { post.Text, post.CreatedAt });

        if (sinceUtc.HasValue)
        {
            query = query.Where(post => post.CreatedAt >= sinceUtc.Value);
        }

        var postTexts = await query.Select(post => post.Text).ToListAsync();

        var uniqueHashtags = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var text in postTexts)
        {
            foreach (Match match in HashtagRegex.Matches(text))
            {
                var hashtag = match.Groups[1].Value.Trim();
                if (!string.IsNullOrWhiteSpace(hashtag))
                {
                    uniqueHashtags.Add(hashtag);
                }
            }
        }

        return uniqueHashtags.Count;
    }

    public async Task<IReadOnlyList<PostHashtagUsageEntry>> GetTopUsedHashtagsAsync(int limit, DateTime? sinceUtc = null)
    {
        var safeLimit = Math.Clamp(limit, 1, 20);
        var query = _context.Posts
            .AsNoTracking()
            .Where(post => !string.IsNullOrWhiteSpace(post.Text))
            .Select(post => new { post.Text, post.CreatedAt });

        if (sinceUtc.HasValue)
        {
            query = query.Where(post => post.CreatedAt >= sinceUtc.Value);
        }

        var postTexts = await query.Select(post => post.Text).ToListAsync();

        var hashtagUsage = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var text in postTexts)
        {
            foreach (Match match in HashtagRegex.Matches(text))
            {
                var hashtag = match.Groups[1].Value.Trim();
                if (string.IsNullOrWhiteSpace(hashtag))
                {
                    continue;
                }

                hashtagUsage[hashtag] = hashtagUsage.GetValueOrDefault(hashtag) + 1;
            }
        }

        return hashtagUsage
            .OrderByDescending(entry => entry.Value)
            .ThenBy(entry => entry.Key, StringComparer.OrdinalIgnoreCase)
            .Take(safeLimit)
            .Select(entry => new PostHashtagUsageEntry
            {
                Hashtag = entry.Key,
                Usos = entry.Value
            })
            .ToList();
    }

    private static IQueryable<Post> ApplyVisibilityFilter(
        IQueryable<Post> query,
        Guid? currentUserId,
        IReadOnlyCollection<Guid> followedUserIds)
    {
        if (!currentUserId.HasValue)
        {
            return query.Where(p => !p.User.IsPrivate);
        }

        var userId = currentUserId.Value;
        return query.Where(p =>
            p.UserId == userId ||
            !p.User.IsPrivate ||
            followedUserIds.Contains(p.UserId));
    }
}

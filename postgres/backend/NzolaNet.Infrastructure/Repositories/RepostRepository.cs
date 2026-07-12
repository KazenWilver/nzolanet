using Microsoft.EntityFrameworkCore;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;
using NzolaNet.Infrastructure.Data;

namespace NzolaNet.Infrastructure.Repositories;

public class RepostRepository : IRepostRepository
{
    private readonly ApplicationDbContext _context;

    public RepostRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> HasUserRepostedAsync(Guid userId, Guid postId)
    {
        return await _context.Reposts.AnyAsync(r => r.UserId == userId && r.PostId == postId);
    }

    public async Task<int> GetRepostCountAsync(Guid postId)
    {
        return await _context.Reposts.CountAsync(r => r.PostId == postId);
    }

    public async Task<Dictionary<Guid, int>> GetRepostCountsByPostIdsAsync(IEnumerable<Guid> postIds)
    {
        var ids = postIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return new Dictionary<Guid, int>();
        }

        return await _context.Reposts
            .AsNoTracking()
            .Where(r => ids.Contains(r.PostId))
            .GroupBy(r => r.PostId)
            .Select(g => new { PostId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.PostId, x => x.Count);
    }

    public async Task<HashSet<Guid>> GetRepostedPostIdsForUserAsync(Guid userId, IEnumerable<Guid> postIds)
    {
        var ids = postIds.ToList();
        if (ids.Count == 0)
        {
            return new HashSet<Guid>();
        }

        var reposted = await _context.Reposts
            .AsNoTracking()
            .Where(r => r.UserId == userId && ids.Contains(r.PostId))
            .Select(r => r.PostId)
            .ToListAsync();

        return reposted.ToHashSet();
    }

    public async Task<IReadOnlyList<Repost>> GetUserRepostsAsync(Guid userId)
    {
        return await _context.Reposts
            .AsNoTracking()
            .Include(repost => repost.Post)
                .ThenInclude(post => post.User)
            .Include(repost => repost.Post)
                .ThenInclude(post => post.QuotedPost!)
                    .ThenInclude(quotedPost => quotedPost.User)
            .Where(repost => repost.UserId == userId)
            .OrderByDescending(repost => repost.CreatedAt)
            .ToListAsync();
    }

    public async Task<Repost> CreateAsync(Repost repost)
    {
        _context.Reposts.Add(repost);
        await _context.SaveChangesAsync();
        return repost;
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid postId)
    {
        var repost = await _context.Reposts
            .FirstOrDefaultAsync(r => r.UserId == userId && r.PostId == postId);

        if (repost == null)
        {
            return false;
        }

        _context.Reposts.Remove(repost);
        return await _context.SaveChangesAsync() > 0;
    }
}

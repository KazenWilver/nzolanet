using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;
using NzolaNet.Infrastructure.Data;

namespace NzolaNet.Infrastructure.Repositories;

public class LikeRepository : ILikeRepository
{
    private readonly ApplicationDbContext _context;

    public LikeRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Like?> GetByUserAndPostAsync(Guid userId, Guid postId)
    {
        return await _context.Likes
            .FirstOrDefaultAsync(l => l.UserId == userId && l.PostId == postId);
    }

    public async Task<bool> HasUserLikedAsync(Guid userId, Guid postId)
    {
        return await _context.Likes.AnyAsync(l => l.UserId == userId && l.PostId == postId);
    }

    public async Task<bool> CreateAsync(Like like)
    {
        _context.Likes.Add(like);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteAsync(Like like)
    {
        _context.Likes.Remove(like);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<IEnumerable<Post>> GetLikedPostsByUserAsync(Guid userId)
    {
        return await _context.Likes
            .Where(l => l.UserId == userId)
            .Include(l => l.Post)
                .ThenInclude(p => p.User)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => l.Post)
            .AsNoTracking()
            .ToListAsync();
    }

    public Task<int> GetTotalCountAsync()
    {
        return _context.Likes.CountAsync();
    }

    public async Task<Dictionary<Guid, int>> GetLikeCountsByPostIdsAsync(IEnumerable<Guid> postIds)
    {
        var ids = postIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return new Dictionary<Guid, int>();
        }

        return await _context.Likes
            .Where(l => ids.Contains(l.PostId))
            .GroupBy(l => l.PostId)
            .Select(g => new { PostId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.PostId, x => x.Count);
    }

    public async Task<HashSet<Guid>> GetLikedPostIdsForUserAsync(Guid userId, IEnumerable<Guid> postIds)
    {
        var ids = postIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return new HashSet<Guid>();
        }

        var likedIds = await _context.Likes
            .Where(l => l.UserId == userId && ids.Contains(l.PostId))
            .Select(l => l.PostId)
            .ToListAsync();

        return likedIds.ToHashSet();
    }
}

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

    public async Task<int> GetCountByPostIdAsync(Guid postId)
    {
        return await _context.Likes.CountAsync(l => l.PostId == postId);
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
            .Include(l => l.Post)
                .ThenInclude(p => p.Likes)
            .Include(l => l.Post)
                .ThenInclude(p => p.Comments)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => l.Post)
            .ToListAsync();
    }
}

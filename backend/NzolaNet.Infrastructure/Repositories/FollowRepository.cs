using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;
using NzolaNet.Infrastructure.Data;

namespace NzolaNet.Infrastructure.Repositories;

public class FollowRepository : IFollowRepository
{
    private readonly ApplicationDbContext _context;

    public FollowRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<int> GetFollowersCountAsync(Guid userId)
    {
        return await _context.Follows.CountAsync(f => f.FollowedId == userId);
    }

    public async Task<int> GetFollowingCountAsync(Guid userId)
    {
        return await _context.Follows.CountAsync(f => f.FollowerId == userId);
    }

    public async Task<bool> IsFollowingAsync(Guid followerId, Guid followedId)
    {
        return await _context.Follows.AnyAsync(f => f.FollowerId == followerId && f.FollowedId == followedId);
    }

    public async Task<bool> AddFollowAsync(Follow follow)
    {
        _context.Follows.Add(follow);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> RemoveFollowAsync(Guid followerId, Guid followedId)
    {
        var follow = await _context.Follows.FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowedId == followedId);
        if (follow == null)
        {
            return true;
        }

        _context.Follows.Remove(follow);
        return await _context.SaveChangesAsync() > 0;
    }
}

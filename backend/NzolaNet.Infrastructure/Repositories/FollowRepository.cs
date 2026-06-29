using System;
using System.Collections.Generic;
using System.Linq;
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
        return await _context.Follows.CountAsync(f => f.FollowedId == userId && f.IsApproved);
    }

    public async Task<int> GetFollowingCountAsync(Guid userId)
    {
        return await _context.Follows.CountAsync(f => f.FollowerId == userId && f.IsApproved);
    }

    public async Task<bool> IsFollowingAsync(Guid followerId, Guid followedId)
    {
        return await _context.Follows.AnyAsync(f => f.FollowerId == followerId && f.FollowedId == followedId && f.IsApproved);
    }

    public async Task<IEnumerable<Guid>> GetFollowedUserIdsAsync(Guid userId)
    {
        return await _context.Follows
            .Where(f => f.FollowerId == userId && f.IsApproved)
            .Select(f => f.FollowedId)
            .ToListAsync();
    }

    public async Task<IEnumerable<Guid>> GetFollowerIdsAsync(Guid userId)
    {
        return await _context.Follows
            .Where(f => f.FollowedId == userId && f.IsApproved)
            .Select(f => f.FollowerId)
            .ToListAsync();
    }

    public async Task<IEnumerable<Guid>> GetFollowingIdsAsync(Guid userId)
    {
        return await GetFollowedUserIdsAsync(userId);
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

    public async Task<IEnumerable<Follow>> GetPendingFollowRequestsAsync(Guid userId)
    {
        return await _context.Follows
            .Include(f => f.Follower)
            .Where(f => f.FollowedId == userId && !f.IsApproved)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();
    }

    public async Task<Follow?> GetFollowRequestAsync(Guid followerId, Guid followedId)
    {
        return await _context.Follows
            .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowedId == followedId);
    }

    public async Task<bool> UpdateFollowAsync(Follow follow)
    {
        _context.Follows.Update(follow);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> IsFollowPendingAsync(Guid followerId, Guid followedId)
    {
        return await _context.Follows.AnyAsync(f => f.FollowerId == followerId && f.FollowedId == followedId && !f.IsApproved);
    }
}

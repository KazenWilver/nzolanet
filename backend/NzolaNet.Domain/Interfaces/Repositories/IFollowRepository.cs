using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NzolaNet.Domain.Entities;

namespace NzolaNet.Domain.Interfaces.Repositories;

public interface IFollowRepository
{
    Task<int> GetFollowersCountAsync(Guid userId);
    Task<int> GetFollowingCountAsync(Guid userId);
    Task<bool> IsFollowingAsync(Guid followerId, Guid followedId);
    Task<IEnumerable<Guid>> GetFollowedUserIdsAsync(Guid userId);
    Task<bool> AddFollowAsync(Follow follow);
    Task<bool> RemoveFollowAsync(Guid followerId, Guid followedId);
}

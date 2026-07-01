using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NzolaNet.Domain.Entities;

namespace NzolaNet.Domain.Interfaces.Repositories;

public interface IPostRepository
{
    Task<Post?> GetByIdAsync(Guid id);
    Task<IEnumerable<Post>> GetAllAsync();
    Task<(IEnumerable<Post> Items, int TotalCount)> GetAllPagedAsync(int page, int pageSize);
    Task<(IEnumerable<Post> Items, int TotalCount)> GetAllVisiblePagedAsync(
        int page,
        int pageSize,
        Guid? currentUserId,
        IReadOnlyCollection<Guid> followedUserIds);
    Task<Post?> GetByMediaPathAsync(string mediaPath);
    Task<IEnumerable<Post>> GetFeedByFollowedUsersAsync(IEnumerable<Guid> followedUserIds);
    Task<(IEnumerable<Post> Items, int TotalCount)> GetFeedByFollowedUsersPagedAsync(
        IEnumerable<Guid> followedUserIds,
        int page,
        int pageSize);
    Task<IEnumerable<Post>> GetByUserIdAsync(Guid userId);
    Task<(IEnumerable<Post> Items, int TotalCount)> GetByUserIdPagedAsync(
        Guid userId,
        int page,
        int pageSize,
        bool mediaOnly = false);
    Task<(IEnumerable<Post> Items, int TotalCount)> SearchByHashtagAsync(string tag, int page, int pageSize);
    Task<IEnumerable<string>> GetRecentPostTextsAsync(int limit);
    Task<bool> CreateAsync(Post post);
    Task<bool> UpdateAsync(Post post);
    Task<bool> DeleteAsync(Post post);
    Task<int> GetTotalCountAsync();
}

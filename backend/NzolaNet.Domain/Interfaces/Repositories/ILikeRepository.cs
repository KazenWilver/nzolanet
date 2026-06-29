using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NzolaNet.Domain.Entities;

namespace NzolaNet.Domain.Interfaces.Repositories;

public interface ILikeRepository
{
    Task<Like?> GetByUserAndPostAsync(Guid userId, Guid postId);
    Task<int> GetCountByPostIdAsync(Guid postId);
    Task<bool> HasUserLikedAsync(Guid userId, Guid postId);
    Task<bool> CreateAsync(Like like);
    Task<bool> DeleteAsync(Like like);
    Task<IEnumerable<Post>> GetLikedPostsByUserAsync(Guid userId);
}

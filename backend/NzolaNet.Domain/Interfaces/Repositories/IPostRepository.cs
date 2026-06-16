using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NzolaNet.Domain.Entities;

namespace NzolaNet.Domain.Interfaces.Repositories;

public interface IPostRepository
{
    Task<Post?> GetByIdAsync(Guid id);
    Task<IEnumerable<Post>> GetFeedAsync();
    Task<bool> CreateAsync(Post post);
    Task<bool> UpdateAsync(Post post);
    Task<bool> DeleteAsync(Post post);
}

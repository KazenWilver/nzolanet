using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NzolaNet.Application.DTOs.Posts;

namespace NzolaNet.Application.Interfaces;

public interface IPostService
{
    Task<PostDto> CreateAsync(Guid userId, CreatePostDto createDto);
    Task<PostDto> UpdateAsync(Guid userId, Guid postId, UpdatePostDto updateDto);
    Task<bool> DeleteAsync(Guid userId, Guid postId);
    Task<IEnumerable<PostDto>> GetAllAsync(Guid? currentUserId = null);
    Task<IEnumerable<PostDto>> GetFeedAsync(Guid userId);
}

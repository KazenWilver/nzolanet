using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NzolaNet.Application.DTOs.Comments;

namespace NzolaNet.Application.Interfaces;

public interface ICommentService
{
    Task<CommentDto> CreateAsync(Guid userId, Guid postId, CreateCommentDto createDto);
    Task<bool> DeleteAsync(Guid userId, Guid commentId);
    Task<IEnumerable<CommentDto>> GetByPostIdAsync(Guid postId);
}

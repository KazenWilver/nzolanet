using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NzolaNet.Application.DTOs.Comments;

namespace NzolaNet.Application.Interfaces;

public interface ICommentService
{
    Task<CommentDto> CreateAsync(Guid userId, CreateCommentDto createDto);
    Task<CommentDto> UpdateAsync(Guid userId, Guid commentId, UpdateCommentDto updateDto);
    Task<bool> DeleteAsync(Guid userId, Guid commentId);
    Task<IEnumerable<CommentDto>> GetByPostAsync(Guid postId);
}

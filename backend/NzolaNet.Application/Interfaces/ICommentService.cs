using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NzolaNet.Application.DTOs.Comments;

namespace NzolaNet.Application.Interfaces;

public interface ICommentService
{
    Task<CommentResponseDto> CreateAsync(Guid userId, Guid publicationId, CreateCommentDto createDto);
    Task<CommentResponseDto> UpdateAsync(Guid userId, Guid commentId, UpdateCommentDto updateDto);
    Task DeleteAsync(Guid userId, Guid commentId, bool isAdmin);
    Task<IEnumerable<CommentResponseDto>> GetByPublicationAsync(Guid publicationId, Guid? currentUserId = null);
    Task<IEnumerable<CommentDto>> GetAllAsync();
    Task<int> GetTotalCountAsync();
}

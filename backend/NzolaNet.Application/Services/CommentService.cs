using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using NzolaNet.Application.DTOs.Comments;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;

namespace NzolaNet.Application.Services;

public class CommentService : ICommentService
{
    private readonly ICommentRepository _commentRepository;
    private readonly IPostRepository _postRepository;
    private readonly IUserRepository _userRepository;

    public CommentService(
        ICommentRepository commentRepository,
        IPostRepository postRepository,
        IUserRepository userRepository)
    {
        _commentRepository = commentRepository;
        _postRepository = postRepository;
        _userRepository = userRepository;
    }

    public async Task<CommentDto> CreateAsync(Guid userId, CreateCommentDto createDto)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("Utilizador não encontrado.");
        }

        var post = await _postRepository.GetByIdAsync(createDto.PostId);
        if (post == null)
        {
            throw new ArgumentException("Publicação não encontrada.");
        }

        var comment = new Comment
        {
            UserId = userId,
            PostId = createDto.PostId,
            Text = createDto.Text,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _commentRepository.CreateAsync(comment);
        if (!created)
        {
            throw new ArgumentException("Não foi possível adicionar o comentário.");
        }

        comment.User = user;

        return MapToDto(comment);
    }

    public async Task<CommentDto> UpdateAsync(Guid userId, Guid commentId, UpdateCommentDto updateDto)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId);
        if (comment == null)
        {
            throw new ArgumentException("Comentário não encontrado.");
        }

        // Regra de Negócio: Apenas o autor do comentário pode editá-lo
        if (comment.UserId != userId)
        {
            throw new UnauthorizedAccessException("Não tens permissão para editar este comentário.");
        }

        comment.Text = updateDto.Text;
        comment.UpdatedAt = DateTime.UtcNow;

        var updated = await _commentRepository.UpdateAsync(comment);
        if (!updated)
        {
            throw new ArgumentException("Não foi possível atualizar o comentário.");
        }

        return MapToDto(comment);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid commentId)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId);
        if (comment == null)
        {
            throw new ArgumentException("Comentário não encontrado.");
        }

        // Regra de Negócio: Apenas o autor do comentário pode eliminá-lo
        if (comment.UserId != userId)
        {
            throw new UnauthorizedAccessException("Não tens permissão para eliminar este comentário.");
        }

        return await _commentRepository.DeleteAsync(comment);
    }

    public async Task<IEnumerable<CommentDto>> GetByPostAsync(Guid postId)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post == null)
        {
            throw new ArgumentException("Publicação não encontrada.");
        }

        var comments = await _commentRepository.GetByPostIdAsync(postId);
        return comments.Select(MapToDto);
    }

    private CommentDto MapToDto(Comment comment)
    {
        return new CommentDto
        {
            Id = comment.Id,
            UserId = comment.UserId,
            UserName = comment.User?.UserName ?? string.Empty,
            UserPhoto = comment.User?.ProfilePhoto,
            PostId = comment.PostId,
            Text = comment.Text,
            CreatedAt = comment.CreatedAt
        };
    }
}

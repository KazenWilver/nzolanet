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
    private readonly IFollowRepository _followRepository;

    public CommentService(
        ICommentRepository commentRepository,
        IPostRepository postRepository,
        IUserRepository userRepository,
        IFollowRepository followRepository)
    {
        _commentRepository = commentRepository;
        _postRepository = postRepository;
        _userRepository = userRepository;
        _followRepository = followRepository;
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

        // Regra de privacidade: Não pode comentar se o autor do post for privado e o utilizador não o seguir (e não for ele próprio)
        if (post.User.IsPrivate && post.UserId != userId)
        {
            var isFollowing = await _followRepository.IsFollowingAsync(userId, post.UserId);
            if (!isFollowing)
            {
                throw new UnauthorizedAccessException("Não podes comentar numa publicação de uma conta privada que não segues.");
            }
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

    public async Task<IEnumerable<CommentDto>> GetByPostAsync(Guid postId, Guid? currentUserId = null)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post == null)
        {
            throw new ArgumentException("Publicação não encontrada.");
        }

        // Regra de privacidade: Não pode ver os comentários se o autor do post for privado e o utilizador atual não o seguir
        if (post.User.IsPrivate)
        {
            if (!currentUserId.HasValue)
            {
                throw new UnauthorizedAccessException("Esta publicação é privada.");
            }

            if (post.UserId != currentUserId.Value)
            {
                var isFollowing = await _followRepository.IsFollowingAsync(currentUserId.Value, post.UserId);
                if (!isFollowing)
                {
                    throw new UnauthorizedAccessException("Esta publicação é privada e não segue o autor.");
                }
            }
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

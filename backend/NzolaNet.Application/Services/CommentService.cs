using NzolaNet.Application.DTOs.Comments;
using NzolaNet.Application.Helpers;
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
    private readonly INotificationService _notificationService;
    private readonly INotificationRepository _notificationRepository;

    public CommentService(
        ICommentRepository commentRepository,
        IPostRepository postRepository,
        IUserRepository userRepository,
        IFollowRepository followRepository,
        INotificationService notificationService,
        INotificationRepository notificationRepository)
    {
        _commentRepository = commentRepository;
        _postRepository = postRepository;
        _userRepository = userRepository;
        _followRepository = followRepository;
        _notificationService = notificationService;
        _notificationRepository = notificationRepository;
    }

    public async Task<CommentResponseDto> CreateAsync(Guid userId, Guid publicationId, CreateCommentDto createDto)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("Utilizador não encontrado.");
        }

        var post = await _postRepository.GetByIdAsync(publicationId);
        if (post == null)
        {
            throw new ArgumentException("Publicação não encontrada.");
        }

        if (post.User.IsPrivate && post.UserId != userId)
        {
            var isFollowing = await _followRepository.IsFollowingAsync(userId, post.UserId);
            if (!isFollowing)
            {
                throw new UnauthorizedAccessException("Não podes comentar numa publicação de uma conta privada que não segues.");
            }
        }

        var text = createDto.Text?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(text))
        {
            throw new ArgumentException("O comentário não pode estar vazio.");
        }

        ContentLimits.ValidateCommentText(text);

        var comment = new Comment
        {
            UserId = userId,
            PostId = publicationId,
            Text = text,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _commentRepository.CreateAsync(comment);
        if (!created)
        {
            throw new ArgumentException("Não foi possível adicionar o comentário.");
        }

        comment.User = user;
        await _notificationService.TryCreateCommentNotificationAsync(
            userId,
            publicationId,
            comment.Id,
            post.UserId);

        return MapToResponseDto(comment);
    }

    public async Task<CommentResponseDto> UpdateAsync(Guid userId, Guid commentId, UpdateCommentDto updateDto)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId);
        if (comment == null)
        {
            throw new ArgumentException("Comentário não encontrado.");
        }

        if (comment.UserId != userId)
        {
            throw new UnauthorizedAccessException("Não tens permissão para editar este comentário.");
        }

        var text = updateDto.Text?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(text))
        {
            throw new ArgumentException("O comentário não pode estar vazio.");
        }

        ContentLimits.ValidateCommentText(text);
        comment.Text = text;
        comment.UpdatedAt = DateTime.UtcNow;

        var updated = await _commentRepository.UpdateAsync(comment);
        if (!updated)
        {
            throw new ArgumentException("Não foi possível atualizar o comentário.");
        }

        return MapToResponseDto(comment);
    }

    public async Task DeleteAsync(Guid userId, Guid commentId, bool isAdmin)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId);
        if (comment == null)
        {
            throw new ArgumentException("Comentário não encontrado.");
        }

        if (comment.UserId != userId && !isAdmin)
        {
            throw new UnauthorizedAccessException("Não tens permissão para eliminar este comentário.");
        }

        await _notificationRepository.DeleteByCommentIdAsync(commentId);

        var deleted = await _commentRepository.DeleteAsync(comment);
        if (!deleted)
        {
            throw new ArgumentException("Não foi possível eliminar o comentário.");
        }
    }

    public async Task<IEnumerable<CommentResponseDto>> GetByPublicationAsync(Guid publicationId, Guid? currentUserId = null)
    {
        var post = await _postRepository.GetByIdAsync(publicationId);
        if (post == null)
        {
            throw new ArgumentException("Publicação não encontrada.");
        }

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

        var comments = await _commentRepository.GetByPostIdAsync(publicationId);
        return comments.Select(MapToResponseDto);
    }

    public async Task<IEnumerable<CommentDto>> GetAllAsync()
    {
        var comments = await _commentRepository.GetAllAsync();
        return comments.Select(MapToLegacyDto);
    }

    public async Task<int> GetTotalCountAsync()
    {
        return await _commentRepository.GetTotalCountAsync();
    }

    private static CommentResponseDto MapToResponseDto(Comment comment)
    {
        return new CommentResponseDto
        {
            Id = comment.Id,
            Text = comment.Text,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt,
            PublicationId = comment.PostId,
            AuthorId = comment.UserId,
            AuthorUsername = comment.User?.UserName ?? string.Empty,
            AuthorDisplayName = comment.User?.DisplayName,
            AuthorPhotoUrl = comment.User?.ProfilePhoto
        };
    }

    private static CommentDto MapToLegacyDto(Comment comment)
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

using NzolaNet.Application.Exceptions;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;

namespace NzolaNet.Application.Services;

public class LikeService : ILikeService
{
    private readonly ILikeRepository _likeRepository;
    private readonly IPostRepository _postRepository;
    private readonly IFollowRepository _followRepository;
    private readonly INotificationService _notificationService;

    public LikeService(
        ILikeRepository likeRepository,
        IPostRepository postRepository,
        IFollowRepository followRepository,
        INotificationService notificationService)
    {
        _likeRepository = likeRepository;
        _postRepository = postRepository;
        _followRepository = followRepository;
        _notificationService = notificationService;
    }

    public async Task LikeAsync(Guid userId, Guid postId)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post == null)
        {
            throw new ArgumentException("Publicação não encontrada.");
        }

        await EnsureCanInteractWithPostAsync(userId, post);

        if (await _likeRepository.HasUserLikedAsync(userId, postId))
        {
            throw new ConflictException("Já deste baze nesta publicação.");
        }

        var like = new Like
        {
            UserId = userId,
            PostId = postId,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _likeRepository.CreateAsync(like);
        if (!created)
        {
            throw new ArgumentException("Não foi possível dar baze na publicação.");
        }

        await _notificationService.TryCreateBazeNotificationAsync(userId, postId, post.UserId);
    }

    public async Task UnlikeAsync(Guid userId, Guid postId)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post == null)
        {
            throw new ArgumentException("Publicação não encontrada.");
        }

        await EnsureCanInteractWithPostAsync(userId, post);

        var existingLike = await _likeRepository.GetByUserAndPostAsync(userId, postId);
        if (existingLike == null)
        {
            throw new ArgumentException("Ainda não deste baze nesta publicação.");
        }

        var deleted = await _likeRepository.DeleteAsync(existingLike);
        if (!deleted)
        {
            throw new ArgumentException("Não foi possível remover o baze.");
        }

        await _notificationService.CleanupBazeNotificationAsync(userId, postId, post.UserId);
    }

    public async Task<bool> ToggleLikeAsync(Guid userId, Guid postId)
    {
        if (await _likeRepository.HasUserLikedAsync(userId, postId))
        {
            await UnlikeAsync(userId, postId);
            return true;
        }

        await LikeAsync(userId, postId);
        return true;
    }

    public async Task<int> GetLikeCountAsync(Guid postId)
    {
        return await _likeRepository.GetCountByPostIdAsync(postId);
    }

    public async Task<bool> HasUserLikedAsync(Guid userId, Guid postId)
    {
        return await _likeRepository.HasUserLikedAsync(userId, postId);
    }

    private async Task EnsureCanInteractWithPostAsync(Guid userId, Post post)
    {
        var author = post.User;
        if (author == null || !author.IsPrivate || author.Id == userId)
        {
            return;
        }

        var isFollowing = await _followRepository.IsFollowingAsync(userId, author.Id);
        if (!isFollowing)
        {
            throw new UnauthorizedAccessException("Este perfil é privado.");
        }
    }
}

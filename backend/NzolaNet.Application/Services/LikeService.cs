using NzolaNet.Application.Exceptions;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;

namespace NzolaNet.Application.Services;

public class LikeService : ILikeService
{
    private readonly ILikeRepository _likeRepository;
    private readonly IPostRepository _postRepository;

    public LikeService(ILikeRepository likeRepository, IPostRepository postRepository)
    {
        _likeRepository = likeRepository;
        _postRepository = postRepository;
    }

    public async Task LikeAsync(Guid userId, Guid postId)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post == null)
        {
            throw new ArgumentException("Publicação não encontrada.");
        }

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
    }

    public async Task UnlikeAsync(Guid userId, Guid postId)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post == null)
        {
            throw new ArgumentException("Publicação não encontrada.");
        }

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
}

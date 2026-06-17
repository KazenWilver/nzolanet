using System;
using System.Threading.Tasks;
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

    public async Task<bool> ToggleLikeAsync(Guid userId, Guid postId)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post == null)
        {
            throw new ArgumentException("Publicação não encontrada.");
        }

        var existingLike = await _likeRepository.GetByUserAndPostAsync(userId, postId);

        if (existingLike != null)
        {
            return await _likeRepository.DeleteAsync(existingLike);
        }
        else
        {
            var like = new Like
            {
                UserId = userId,
                PostId = postId,
                CreatedAt = DateTime.UtcNow
            };
            return await _likeRepository.CreateAsync(like);
        }
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

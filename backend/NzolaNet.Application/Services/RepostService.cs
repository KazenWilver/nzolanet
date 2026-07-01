using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;

namespace NzolaNet.Application.Services;

public class RepostService : IRepostService
{
    private readonly IRepostRepository _repostRepository;
    private readonly IPostRepository _postRepository;

    public RepostService(IRepostRepository repostRepository, IPostRepository postRepository)
    {
        _repostRepository = repostRepository;
        _postRepository = postRepository;
    }

    public async Task<(bool IsReposted, int RepostsCount)> ToggleRepostAsync(Guid userId, Guid postId)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post == null)
        {
            throw new ArgumentException("Publicação não encontrada.");
        }

        var hasReposted = await _repostRepository.HasUserRepostedAsync(userId, postId);
        if (hasReposted)
        {
            await _repostRepository.DeleteAsync(userId, postId);
        }
        else
        {
            await _repostRepository.CreateAsync(new Repost
            {
                UserId = userId,
                PostId = postId,
                CreatedAt = DateTime.UtcNow
            });
        }

        var count = await _repostRepository.GetRepostCountAsync(postId);
        return (!hasReposted, count);
    }

    public Task<int> GetRepostCountAsync(Guid postId)
    {
        return _repostRepository.GetRepostCountAsync(postId);
    }

    public Task<bool> HasUserRepostedAsync(Guid userId, Guid postId)
    {
        return _repostRepository.HasUserRepostedAsync(userId, postId);
    }
}

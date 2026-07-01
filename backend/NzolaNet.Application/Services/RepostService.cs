using NzolaNet.Application.DTOs.Publications;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;

namespace NzolaNet.Application.Services;

public class RepostService : IRepostService
{
    private readonly IRepostRepository _repostRepository;
    private readonly IPostRepository _postRepository;
    private readonly IUserRepository _userRepository;

    public RepostService(
        IRepostRepository repostRepository,
        IPostRepository postRepository,
        IUserRepository userRepository)
    {
        _repostRepository = repostRepository;
        _postRepository = postRepository;
        _userRepository = userRepository;
    }

    public async Task<(bool IsReposted, int RepostsCount)> ToggleRepostAsync(Guid userId, Guid postId)
    {
        var (isReposted, count, _) = await RepostAsync(userId, postId, null);
        return (isReposted, count);
    }

    public async Task<(bool IsReposted, int RepostsCount, PublicationResponseDto? QuotedPublication)> RepostAsync(
        Guid userId,
        Guid postId,
        string? quoteText)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post == null)
        {
            throw new ArgumentException("Publicação não encontrada.");
        }

        if (post.UserId == userId)
        {
            throw new ArgumentException("Não podes repartilhar a tua própria publicação.");
        }

        var hasReposted = await _repostRepository.HasUserRepostedAsync(userId, postId);
        PublicationResponseDto? quotedPublication = null;
        var trimmedQuote = quoteText?.Trim();

        if (!string.IsNullOrWhiteSpace(trimmedQuote))
        {
            var author = await _userRepository.GetByIdAsync(userId);
            if (author == null)
            {
                throw new ArgumentException("Utilizador não encontrado.");
            }

            var quotedPost = new Post
            {
                UserId = userId,
                Text = trimmedQuote,
                QuotedPostId = postId,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _postRepository.CreateAsync(quotedPost);
            if (!created)
            {
                throw new ArgumentException("Não foi possível republicar com comentário.");
            }

            quotedPublication = MapToDto(quotedPost, post, author);
        }

        if (!hasReposted)
        {
            await _repostRepository.CreateAsync(new Repost
            {
                UserId = userId,
                PostId = postId,
                CreatedAt = DateTime.UtcNow
            });
        }

        var count = await _repostRepository.GetRepostCountAsync(postId);
        return (true, count, quotedPublication);
    }

    public Task<int> GetRepostCountAsync(Guid postId)
    {
        return _repostRepository.GetRepostCountAsync(postId);
    }

    public Task<bool> HasUserRepostedAsync(Guid userId, Guid postId)
    {
        return _repostRepository.HasUserRepostedAsync(userId, postId);
    }

    private static PublicationResponseDto MapToDto(Post post, Post quotedSource, User author)
    {
        return new PublicationResponseDto
        {
            Id = post.Id,
            Text = post.Text,
            CreatedAt = post.CreatedAt,
            AuthorId = post.UserId,
            AuthorUsername = author.UserName ?? string.Empty,
            AuthorDisplayName = author.DisplayName,
            AuthorPhotoUrl = author.ProfilePhoto,
            QuotedPublication = new PublicationResponseDto
            {
                Id = quotedSource.Id,
                Text = quotedSource.Text,
                ImageUrl = quotedSource.ImagePath,
                VideoUrl = quotedSource.VideoPath,
                CreatedAt = quotedSource.CreatedAt,
                AuthorId = quotedSource.UserId,
                AuthorUsername = quotedSource.User?.UserName ?? string.Empty,
                AuthorDisplayName = quotedSource.User?.DisplayName,
                AuthorPhotoUrl = quotedSource.User?.ProfilePhoto
            }
        };
    }
}

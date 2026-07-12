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
    private readonly INotificationService _notificationService;

    public RepostService(
        IRepostRepository repostRepository,
        IPostRepository postRepository,
        IUserRepository userRepository,
        INotificationService notificationService)
    {
        _repostRepository = repostRepository;
        _postRepository = postRepository;
        _userRepository = userRepository;
        _notificationService = notificationService;
    }

    public async Task<(bool IsReposted, int RepostsCount, PublicationResponseDto? QuotedPublication, IReadOnlyList<Guid> RemovedQuotedPublicationIds)> RepostAsync(
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

        var existingQuotedPosts = await _postRepository.GetQuotedPostsByUserAndSourceAsync(userId, postId);
        var hasReposted = await _repostRepository.HasUserRepostedAsync(userId, postId) || existingQuotedPosts.Count > 0;
        PublicationResponseDto? quotedPublication = null;
        var trimmedQuote = quoteText?.Trim();
        var removedQuotedPublicationIds = new List<Guid>();

        if (hasReposted)
        {
            await _repostRepository.DeleteAsync(userId, postId);

            foreach (var quotedPost in existingQuotedPosts)
            {
                removedQuotedPublicationIds.Add(quotedPost.Id);
                await _postRepository.DeleteAsync(quotedPost);
            }

            var currentCount = await _repostRepository.GetRepostCountAsync(postId);
            return (false, currentCount, null, removedQuotedPublicationIds);
        }

        var author = await _userRepository.GetByIdAsync(userId);
        if (author == null)
        {
            throw new ArgumentException("Utilizador não encontrado.");
        }

        var repostWrapperPost = new Post
        {
            UserId = userId,
            Text = trimmedQuote ?? string.Empty,
            QuotedPostId = postId,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _postRepository.CreateAsync(repostWrapperPost);
        if (!created)
        {
            throw new ArgumentException("Não foi possível repartilhar a publicação.");
        }

        quotedPublication = MapToDto(repostWrapperPost, post, author);

        await _repostRepository.CreateAsync(new Repost
        {
            UserId = userId,
            PostId = postId,
            CreatedAt = DateTime.UtcNow
        });

        var preview = string.IsNullOrWhiteSpace(post.Text)
            ? "repartilhou a tua publicação"
            : post.Text;
        await _notificationService.TryCreateRepostNotificationAsync(userId, postId, post.UserId, preview);

        var count = await _repostRepository.GetRepostCountAsync(postId);
        return (true, count, quotedPublication, removedQuotedPublicationIds);
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

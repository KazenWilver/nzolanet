using NzolaNet.Application.DTOs.Publications;
using NzolaNet.Application.Helpers;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;

namespace NzolaNet.Application.Services;

public class PostService : IPostService
{
    private readonly IPostRepository _postRepository;
    private readonly IUserRepository _userRepository;
    private readonly IFollowRepository _followRepository;
    private readonly ILikeRepository _likeRepository;
    private readonly ICommentRepository _commentRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly IRepostRepository _repostRepository;
    private readonly IBookmarkRepository _bookmarkRepository;
    private readonly IStorageService _storageService;
    private readonly INotificationService _notificationService;

    public PostService(
        IPostRepository postRepository,
        IUserRepository userRepository,
        IFollowRepository followRepository,
        ILikeRepository likeRepository,
        ICommentRepository commentRepository,
        INotificationRepository notificationRepository,
        IRepostRepository repostRepository,
        IBookmarkRepository bookmarkRepository,
        IStorageService storageService,
        INotificationService notificationService)
    {
        _postRepository = postRepository;
        _userRepository = userRepository;
        _followRepository = followRepository;
        _likeRepository = likeRepository;
        _commentRepository = commentRepository;
        _notificationRepository = notificationRepository;
        _repostRepository = repostRepository;
        _bookmarkRepository = bookmarkRepository;
        _storageService = storageService;
        _notificationService = notificationService;
    }

    public async Task<PublicationResponseDto> CreateAsync(Guid userId, CreatePublicationDto createDto)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("Utilizador não encontrado.");
        }

        var hasText = !string.IsNullOrWhiteSpace(createDto.Text);
        var hasImage = createDto.Image is { Length: > 0 };
        var hasVideo = createDto.Video is { Length: > 0 };

        if (!hasText && !hasImage && !hasVideo)
        {
            throw new ArgumentException("A publicação deve conter texto, imagem ou vídeo.");
        }

        ContentLimits.ValidatePublicationText(createDto.Text);

        if (hasImage)
        {
            FileHelper.ValidateImageFile(createDto.Image!);
        }

        if (hasVideo)
        {
            FileHelper.ValidateVideoFile(createDto.Video!);
        }

        var post = new Post
        {
            UserId = userId,
            Text = createDto.Text ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _postRepository.CreateAsync(post);
        if (!created)
        {
            throw new ArgumentException("Não foi possível publicar.");
        }

        if (hasImage)
        {
            var imageFileName = FileHelper.BuildPublicationFileName(post.Id, createDto.Image!.FileName);
            post.ImagePath = await _storageService.SaveFileAsync(createDto.Image, "uploads/publications", imageFileName);
        }

        if (hasVideo)
        {
            var videoFileName = FileHelper.BuildPublicationFileName(post.Id, createDto.Video!.FileName);
            post.VideoPath = await _storageService.SaveFileAsync(createDto.Video, "uploads/publications", videoFileName);
        }

        if (hasImage || hasVideo)
        {
            await _postRepository.UpdateAsync(post);
        }

        post.User = user;
        await NotifyMentionedUsersAsync(userId, post.Id, createDto.Text);
        return MapToDto(post, userId);
    }

    private async Task NotifyMentionedUsersAsync(Guid actorId, Guid publicationId, string? text)
    {
        var mentions = ContentParsingHelper.ExtractMentions(text);
        if (mentions.Count == 0)
        {
            return;
        }

        foreach (var username in mentions)
        {
            var mentionedUser = await _userRepository.GetByUsernameAsync(username);
            if (mentionedUser == null)
            {
                continue;
            }

            await _notificationService.TryCreateMentionNotificationAsync(
                actorId,
                publicationId,
                mentionedUser.Id);
        }
    }

    public async Task<PublicationResponseDto> UpdateAsync(Guid userId, Guid postId, UpdatePublicationDto updateDto)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post == null)
        {
            throw new ArgumentException("Publicação não encontrada.");
        }

        if (post.UserId != userId)
        {
            throw new UnauthorizedAccessException("Não tens permissão para editar esta publicação.");
        }

        if (updateDto.Text != null)
        {
            ContentLimits.ValidatePublicationText(updateDto.Text);
            post.Text = updateDto.Text;
        }

        var hasText = !string.IsNullOrWhiteSpace(post.Text);
        var hasImage = !string.IsNullOrEmpty(post.ImagePath);
        var hasVideo = !string.IsNullOrEmpty(post.VideoPath);

        if (!hasText && !hasImage && !hasVideo)
        {
            throw new ArgumentException("A publicação deve conter texto, imagem ou vídeo.");
        }

        post.UpdatedAt = DateTime.UtcNow;

        var updated = await _postRepository.UpdateAsync(post);
        if (!updated)
        {
            throw new ArgumentException("Não foi possível atualizar a publicação.");
        }

        return MapToDto(post, userId);
    }

    public async Task DeleteAsync(Guid userId, Guid postId, bool isAdmin = false)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post == null)
        {
            throw new ArgumentException("Publicação não encontrada.");
        }

        if (post.UserId != userId && !isAdmin)
        {
            throw new UnauthorizedAccessException("Não tens permissão para eliminar esta publicação.");
        }

        if (!string.IsNullOrEmpty(post.ImagePath))
        {
            _storageService.DeleteFile(post.ImagePath);
        }

        if (!string.IsNullOrEmpty(post.VideoPath))
        {
            _storageService.DeleteFile(post.VideoPath);
        }

        await _notificationRepository.DeleteByPublicationIdAsync(postId);

        var deleted = await _postRepository.DeleteAsync(post);
        if (!deleted)
        {
            throw new ArgumentException("Não foi possível eliminar a publicação.");
        }
    }

    public async Task<IEnumerable<PublicationResponseDto>> GetAllAsync(Guid? currentUserId = null)
    {
        var posts = await _postRepository.GetAllAsync();

        if (currentUserId.HasValue)
        {
            var followedIds = (await _followRepository.GetFollowedUserIdsAsync(currentUserId.Value)).ToHashSet();
            posts = posts.Where(p =>
                p.UserId == currentUserId.Value ||
                !p.User.IsPrivate ||
                followedIds.Contains(p.UserId));
        }
        else
        {
            posts = posts.Where(p => !p.User.IsPrivate);
        }

        return await MapPostsToDtosAsync(posts, currentUserId);
    }

    public async Task<PaginatedPublicationsResponseDto> GetAllPagedAsync(
        Guid? currentUserId,
        int page,
        int pageSize)
    {
        HashSet<Guid> followedIds = new();

        if (currentUserId.HasValue)
        {
            followedIds = (await _followRepository.GetFollowedUserIdsAsync(currentUserId.Value)).ToHashSet();
        }

        var (items, totalCount) = await _postRepository.GetAllVisiblePagedAsync(
            page,
            pageSize,
            currentUserId,
            followedIds);
        var dtos = (await MapPostsToDtosAsync(items, currentUserId)).ToList();

        return BuildPaginatedResponse(dtos, page, pageSize, totalCount);
    }

    public async Task<IEnumerable<PublicationResponseDto>> GetFollowingFeedAsync(Guid userId)
    {
        var followedIds = (await _followRepository.GetFollowedUserIdsAsync(userId)).ToList();
        followedIds.Add(userId);

        var posts = await _postRepository.GetFeedByFollowedUsersAsync(followedIds);

        return await MapPostsToDtosAsync(posts, userId);
    }

    public async Task<PaginatedPublicationsResponseDto> GetFollowingFeedPagedAsync(
        Guid userId,
        int page,
        int pageSize)
    {
        var followedIds = (await _followRepository.GetFollowedUserIdsAsync(userId)).ToList();
        followedIds.Add(userId);

        var (items, totalCount) = await _postRepository.GetFeedByFollowedUsersPagedAsync(
            followedIds,
            page,
            pageSize);
        var dtos = (await MapPostsToDtosAsync(items, userId)).ToList();

        return BuildPaginatedResponse(dtos, page, pageSize, totalCount);
    }

    public async Task<PublicationResponseDto?> GetByIdAsync(Guid id, Guid? currentUserId = null)
    {
        var post = await _postRepository.GetByIdAsync(id);
        if (post == null)
        {
            return null;
        }

        var author = post.User;
        if (author != null && author.IsPrivate && author.Id != currentUserId)
        {
            if (!currentUserId.HasValue)
            {
                throw new UnauthorizedAccessException("Este perfil é privado.");
            }

            var isFollowing = await _followRepository.IsFollowingAsync(currentUserId.Value, author.Id);
            if (!isFollowing)
            {
                throw new UnauthorizedAccessException("Este perfil é privado.");
            }
        }

        return (await MapPostsToDtosAsync(new[] { post }, currentUserId)).FirstOrDefault();
    }

    public async Task<IEnumerable<PublicationResponseDto>> GetByUserIdAsync(Guid targetUserId, Guid? currentUserId = null)
    {
        await EnsureCanViewUserPostsAsync(targetUserId, currentUserId);

        var posts = await _postRepository.GetByUserIdAsync(targetUserId);
        return await MapPostsToDtosAsync(posts, currentUserId);
    }

    public async Task<PaginatedPublicationsResponseDto> GetByUserIdPagedAsync(
        Guid targetUserId,
        Guid? currentUserId,
        int page,
        int pageSize,
        bool mediaOnly = false)
    {
        await EnsureCanViewUserPostsAsync(targetUserId, currentUserId);

        var (items, totalCount) = await _postRepository.GetByUserIdPagedAsync(
            targetUserId,
            page,
            pageSize,
            mediaOnly);
        var dtos = (await MapPostsToDtosAsync(items, currentUserId)).ToList();

        return BuildPaginatedResponse(dtos, page, pageSize, totalCount);
    }

    public async Task<IEnumerable<PublicationResponseDto>> GetLikedByUserIdAsync(Guid targetUserId, Guid? currentUserId = null)
    {
        await EnsureCanViewUserPostsAsync(targetUserId, currentUserId);

        var likedPosts = await _likeRepository.GetLikedPostsByUserAsync(targetUserId);
        var visiblePosts = new List<Post>();

        foreach (var post in likedPosts)
        {
            if (post.User?.IsPrivate == true && post.UserId != currentUserId)
            {
                if (!currentUserId.HasValue)
                {
                    continue;
                }

                var canViewAuthor = await _followRepository.IsFollowingAsync(currentUserId.Value, post.UserId);
                if (!canViewAuthor)
                {
                    continue;
                }
            }

            visiblePosts.Add(post);
        }

        return await MapPostsToDtosAsync(visiblePosts, currentUserId);
    }

    public async Task<PaginatedPublicationsResponseDto> GetByHashtagAsync(
        string tag,
        Guid? currentUserId,
        int page,
        int pageSize)
    {
        var normalizedTag = tag.Trim().TrimStart('#');
        if (string.IsNullOrWhiteSpace(normalizedTag))
        {
            throw new ArgumentException("Hashtag inválida.");
        }

        var (items, totalCount) = await _postRepository.SearchByHashtagAsync(normalizedTag, page, pageSize);
        var itemList = items
            .Where(post => ContentParsingHelper.ContainsHashtag(post.Text, normalizedTag))
            .ToList();
        HashSet<Guid>? followedIds = null;
        if (currentUserId.HasValue)
        {
            followedIds = (await _followRepository.GetFollowedUserIdsAsync(currentUserId.Value)).ToHashSet();
        }

        var visibleItems = FilterVisiblePosts(itemList, currentUserId, followedIds).ToList();
        var dtos = (await MapPostsToDtosAsync(visibleItems, currentUserId)).ToList();
        return BuildPaginatedResponse(dtos, page, pageSize, visibleItems.Count);
    }

    public async Task<PaginatedPublicationsResponseDto> GetUserRepostsPagedAsync(
        Guid targetUserId,
        Guid? currentUserId,
        int page,
        int pageSize)
    {
        await EnsureCanViewUserPostsAsync(targetUserId, currentUserId);

        var (items, totalCount) = await _postRepository.GetQuotedRepostsByUserPagedAsync(targetUserId, page, pageSize);
        var itemList = items.ToList();
        var dtos = (await MapPostsToDtosAsync(itemList, currentUserId)).ToList();
        return BuildPaginatedResponse(dtos, page, pageSize, totalCount);
    }

    public async Task<IReadOnlyList<TrendingHashtagDto>> GetTrendingHashtagsAsync(int limit = 5)
    {
        var safeLimit = Math.Clamp(limit, 1, 10);
        var postTexts = await _postRepository.GetRecentPostTextsAsync(300);
        var hashtagRegex = new System.Text.RegularExpressions.Regex(
            @"#([A-Za-z0-9_\u00C0-\u024F]+)",
            System.Text.RegularExpressions.RegexOptions.Compiled);

        var counts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var text in postTexts)
        {
            foreach (System.Text.RegularExpressions.Match match in hashtagRegex.Matches(text))
            {
                var hashtag = match.Groups[1].Value;
                if (string.IsNullOrWhiteSpace(hashtag))
                {
                    continue;
                }

                counts[hashtag] = counts.GetValueOrDefault(hashtag) + 1;
            }
        }

        return counts
            .OrderByDescending(entry => entry.Value)
            .ThenBy(entry => entry.Key, StringComparer.OrdinalIgnoreCase)
            .Take(safeLimit)
            .Select(entry => new TrendingHashtagDto
            {
                Tag = entry.Key,
                Count = entry.Value
            })
            .ToList();
    }

    public Task<IEnumerable<PublicationResponseDto>> MapPostsForCurrentUserAsync(
        IEnumerable<Post> posts,
        Guid? currentUserId)
    {
        return MapPostsToDtosAsync(posts, currentUserId);
    }

    private async Task EnsureCanViewUserPostsAsync(Guid targetUserId, Guid? currentUserId)
    {
        var targetUser = await _userRepository.GetByIdAsync(targetUserId);
        if (targetUser == null)
        {
            throw new ArgumentException("Utilizador não encontrado.");
        }

        if (targetUser.IsPrivate && targetUserId != currentUserId)
        {
            if (!currentUserId.HasValue)
            {
                throw new UnauthorizedAccessException("Este perfil é privado.");
            }

            var isFollowing = await _followRepository.IsFollowingAsync(currentUserId.Value, targetUserId);
            if (!isFollowing)
            {
                throw new UnauthorizedAccessException("Este perfil é privado.");
            }
        }
    }

    private static IEnumerable<Post> FilterVisiblePosts(
        IEnumerable<Post> posts,
        Guid? currentUserId,
        HashSet<Guid>? followedIds)
    {
        return posts.Where(post =>
        {
            if (currentUserId.HasValue && post.UserId == currentUserId.Value)
            {
                return true;
            }

            if (post.User == null || !post.User.IsPrivate)
            {
                return true;
            }

            return currentUserId.HasValue && followedIds?.Contains(post.UserId) == true;
        });
    }

    private static PaginatedPublicationsResponseDto BuildPaginatedResponse(
        IReadOnlyList<PublicationResponseDto> items,
        int page,
        int pageSize,
        int totalCount)
    {
        return new PaginatedPublicationsResponseDto
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            HasMore = page * pageSize < totalCount
        };
    }

    private async Task<IEnumerable<PublicationResponseDto>> MapPostsToDtosAsync(
        IEnumerable<Post> posts,
        Guid? currentUserId)
    {
        var postList = posts.ToList();
        if (postList.Count == 0)
        {
            return Array.Empty<PublicationResponseDto>();
        }

        var postIds = postList.Select(p => p.Id).ToList();
        var likeCounts = await _likeRepository.GetLikeCountsByPostIdsAsync(postIds);
        var commentCounts = await _commentRepository.GetCommentCountsByPostIdsAsync(postIds);
        var repostCounts = await _repostRepository.GetRepostCountsByPostIdsAsync(postIds);
        var bookmarkCounts = await _bookmarkRepository.GetBookmarkCountsByPostIdsAsync(postIds);
        HashSet<Guid> likedPostIds = new();
        HashSet<Guid> repostedPostIds = new();
        HashSet<Guid> bookmarkedPostIds = new();

        if (currentUserId.HasValue)
        {
            likedPostIds = await _likeRepository.GetLikedPostIdsForUserAsync(currentUserId.Value, postIds);
            repostedPostIds = await _repostRepository.GetRepostedPostIdsForUserAsync(currentUserId.Value, postIds);
            bookmarkedPostIds = await _bookmarkRepository.GetBookmarkedPostIdsForUserAsync(currentUserId.Value, postIds);
        }

        return postList.Select(post => MapToDto(
            post,
            currentUserId,
            likeCounts.GetValueOrDefault(post.Id),
            commentCounts.GetValueOrDefault(post.Id),
            repostCounts.GetValueOrDefault(post.Id),
            bookmarkCounts.GetValueOrDefault(post.Id),
            currentUserId.HasValue ? likedPostIds.Contains(post.Id) : null,
            currentUserId.HasValue ? repostedPostIds.Contains(post.Id) : null,
            currentUserId.HasValue ? bookmarkedPostIds.Contains(post.Id) : null));
    }

    private static PublicationResponseDto MapToDto(
        Post post,
        Guid? currentUserId = null,
        int? likesCount = null,
        int? commentsCount = null,
        int? repostsCount = null,
        int? bookmarksCount = null,
        bool? hasLiked = null,
        bool? hasReposted = null,
        bool? hasBookmarked = null)
    {
        if (!hasLiked.HasValue && currentUserId.HasValue)
        {
            hasLiked = post.Likes?.Any(l => l.UserId == currentUserId.Value) == true;
        }

        return new PublicationResponseDto
        {
            Id = post.Id,
            Text = post.Text,
            ImageUrl = post.ImagePath,
            VideoUrl = post.VideoPath,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
            AuthorId = post.UserId,
            AuthorUsername = post.User?.UserName ?? string.Empty,
            AuthorDisplayName = post.User?.DisplayName,
            AuthorPhotoUrl = post.User?.ProfilePhoto,
            LikesCount = likesCount ?? post.Likes?.Count ?? 0,
            CommentsCount = commentsCount ?? post.Comments?.Count ?? 0,
            RepostsCount = repostsCount ?? 0,
            BookmarksCount = bookmarksCount ?? 0,
            HasLiked = hasLiked,
            HasReposted = hasReposted,
            HasBookmarked = hasBookmarked,
            QuotedPublication = post.QuotedPost == null ? null : MapQuotedPost(post.QuotedPost)
        };
    }

    private static PublicationResponseDto MapQuotedPost(Post quotedPost)
    {
        return new PublicationResponseDto
        {
            Id = quotedPost.Id,
            Text = quotedPost.Text,
            ImageUrl = quotedPost.ImagePath,
            VideoUrl = quotedPost.VideoPath,
            CreatedAt = quotedPost.CreatedAt,
            AuthorId = quotedPost.UserId,
            AuthorUsername = quotedPost.User?.UserName ?? string.Empty,
            AuthorDisplayName = quotedPost.User?.DisplayName,
            AuthorPhotoUrl = quotedPost.User?.ProfilePhoto
        };
    }
}

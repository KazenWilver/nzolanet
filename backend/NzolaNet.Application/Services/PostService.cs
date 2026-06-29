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
    private readonly INotificationRepository _notificationRepository;
    private readonly IStorageService _storageService;

    public PostService(
        IPostRepository postRepository,
        IUserRepository userRepository,
        IFollowRepository followRepository,
        ILikeRepository likeRepository,
        INotificationRepository notificationRepository,
        IStorageService storageService)
    {
        _postRepository = postRepository;
        _userRepository = userRepository;
        _followRepository = followRepository;
        _likeRepository = likeRepository;
        _notificationRepository = notificationRepository;
        _storageService = storageService;
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
        return MapToDto(post, userId);
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

        post.UpdatedAt = DateTime.UtcNow;

        var updated = await _postRepository.UpdateAsync(post);
        if (!updated)
        {
            throw new ArgumentException("Não foi possível atualizar a publicação.");
        }

        return MapToDto(post, userId);
    }

    public async Task DeleteAsync(Guid userId, Guid postId)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post == null)
        {
            throw new ArgumentException("Publicação não encontrada.");
        }

        if (post.UserId != userId)
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

        return posts.Select(p => MapToDto(p, currentUserId));
    }

    public async Task<IEnumerable<PublicationResponseDto>> GetFeedAsync(Guid userId)
    {
        return await GetFollowingFeedAsync(userId);
    }

    public async Task<IEnumerable<PublicationResponseDto>> GetFollowingFeedAsync(Guid userId)
    {
        var followedIds = (await _followRepository.GetFollowedUserIdsAsync(userId)).ToList();
        followedIds.Add(userId);

        var posts = await _postRepository.GetFeedByFollowedUsersAsync(followedIds);

        return posts.Select(p => MapToDto(p, userId));
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

        return MapToDto(post, currentUserId);
    }

    public async Task<IEnumerable<PublicationResponseDto>> GetByUserIdAsync(Guid targetUserId, Guid? currentUserId = null)
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

        var posts = await _postRepository.GetByUserIdAsync(targetUserId);
        return posts.Select(p => MapToDto(p, currentUserId));
    }

    public async Task<IEnumerable<PublicationResponseDto>> GetLikedByUserIdAsync(Guid targetUserId, Guid? currentUserId = null)
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

        var likedPosts = await _likeRepository.GetLikedPostsByUserAsync(targetUserId);
        var publications = new List<PublicationResponseDto>();

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

            publications.Add(MapToDto(post, currentUserId));
        }

        return publications;
    }

    private static PublicationResponseDto MapToDto(Post post, Guid? currentUserId = null)
    {
        bool? hasLiked = null;
        if (currentUserId.HasValue)
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
            LikesCount = post.Likes?.Count ?? 0,
            CommentsCount = post.Comments?.Count ?? 0,
            HasLiked = hasLiked
        };
    }
}

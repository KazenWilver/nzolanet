using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using NzolaNet.Application.DTOs.Posts;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;

namespace NzolaNet.Application.Services;

public class PostService : IPostService
{
    private readonly IPostRepository _postRepository;
    private readonly IUserRepository _userRepository;
    private readonly IFollowRepository _followRepository;
    private readonly IStorageService _storageService;

    public PostService(
        IPostRepository postRepository, 
        IUserRepository userRepository,
        IFollowRepository followRepository,
        IStorageService storageService)
    {
        _postRepository = postRepository;
        _userRepository = userRepository;
        _followRepository = followRepository;
        _storageService = storageService;
    }

    public async Task<PostDto> CreateAsync(Guid userId, CreatePostDto createDto)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("Utilizador não encontrado.");
        }

        string? imagePath = null;
        string? videoPath = null;

        if (createDto.Image != null && createDto.Image.Length > 0)
        {
            imagePath = await _storageService.SaveFileAsync(createDto.Image, "uploads/posts/images");
        }

        if (createDto.Video != null && createDto.Video.Length > 0)
        {
            videoPath = await _storageService.SaveFileAsync(createDto.Video, "uploads/posts/videos");
        }

        var post = new Post
        {
            UserId = userId,
            Text = createDto.Text,
            ImagePath = imagePath,
            VideoPath = videoPath,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _postRepository.CreateAsync(post);
        if (!created)
        {
            throw new ArgumentException("Não foi possível publicar.");
        }

        post.User = user;

        return MapToDto(post, userId);
    }

    public async Task<PostDto> UpdateAsync(Guid userId, Guid postId, UpdatePostDto updateDto)
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

        post.Text = updateDto.Text;
        post.UpdatedAt = DateTime.UtcNow;

        var updated = await _postRepository.UpdateAsync(post);
        if (!updated)
        {
            throw new ArgumentException("Não foi possível atualizar a publicação.");
        }

        return MapToDto(post, userId);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid postId)
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

        return await _postRepository.DeleteAsync(post);
    }

    public async Task<IEnumerable<PostDto>> GetAllAsync(Guid? currentUserId = null)
    {
        var posts = await _postRepository.GetAllAsync();

        if (currentUserId.HasValue)
        {
            var followedIds = (await _followRepository.GetFollowedUserIdsAsync(currentUserId.Value)).ToHashSet();
            posts = posts.Where(p => 
                p.UserId == currentUserId.Value || 
                !p.User.IsPrivate || 
                followedIds.Contains(p.UserId)
            );
        }
        else
        {
            posts = posts.Where(p => !p.User.IsPrivate);
        }

        return posts.Select(p => MapToDto(p, currentUserId));
    }

    public async Task<IEnumerable<PostDto>> GetFeedAsync(Guid userId)
    {
        return await GetAllAsync(userId);
    }

    public async Task<PostDto?> GetByIdAsync(Guid id, Guid? currentUserId = null)
    {
        var post = await _postRepository.GetByIdAsync(id);
        if (post == null) return null;

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

    public async Task<IEnumerable<PostDto>> GetByUserIdAsync(Guid targetUserId, Guid? currentUserId = null)
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

        var posts = await _postRepository.GetAllAsync();
        var userPosts = posts.Where(p => p.UserId == targetUserId);
        return userPosts.Select(p => MapToDto(p, currentUserId));
    }

    private PostDto MapToDto(Post post, Guid? currentUserId = null)
    {
        return new PostDto
        {
            Id = post.Id,
            UserId = post.UserId,
            UserName = post.User?.UserName ?? string.Empty,
            UserPhoto = post.User?.ProfilePhoto,
            Text = post.Text,
            ImageUrl = post.ImagePath,
            VideoUrl = post.VideoPath,
            CreatedAt = post.CreatedAt,
            CommentsCount = post.Comments?.Count ?? 0,
            BazesCount = post.Likes?.Count ?? 0,
            UserHasBaze = currentUserId.HasValue && post.Likes?.Any(l => l.UserId == currentUserId.Value) == true
        };
    }
}

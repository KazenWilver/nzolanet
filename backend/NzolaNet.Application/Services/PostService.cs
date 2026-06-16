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

        return MapToDto(post);
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

        return MapToDto(post);
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

        return posts.Select(MapToDto);
    }

    public async Task<IEnumerable<PostDto>> GetFeedAsync(Guid userId)
    {
        var followedIds = await _followRepository.GetFollowedUserIdsAsync(userId);
        var posts = await _postRepository.GetFeedByFollowedUsersAsync(followedIds);
        return posts.Select(MapToDto);
    }

    private PostDto MapToDto(Post post)
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
            CommentsCount = post.Comments?.Count ?? 0
        };
    }
}

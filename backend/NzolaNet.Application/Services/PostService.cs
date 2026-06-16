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
    private readonly IStorageService _storageService;

    public PostService(
        IPostRepository postRepository, 
        IUserRepository userRepository, 
        IStorageService storageService)
    {
        _postRepository = postRepository;
        _userRepository = userRepository;
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

        // Fazer upload da imagem se enviada
        if (createDto.Image != null && createDto.Image.Length > 0)
        {
            imagePath = await _storageService.SaveFileAsync(createDto.Image, "uploads/posts/images");
        }

        // Fazer upload do vídeo se enviado
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

        // Carregar o utilizador no objeto do post para o mapeamento
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

        // Regra de Negócio: Apenas o dono pode editar a sua própria publicação
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

        // Regra de Negócio: Apenas o dono pode eliminar a sua própria publicação
        if (post.UserId != userId)
        {
            throw new UnauthorizedAccessException("Não tens permissão para eliminar esta publicação.");
        }

        // Eliminar os ficheiros físicos associados (imagem/vídeo)
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

    public async Task<IEnumerable<PostDto>> GetFeedAsync()
    {
        var posts = await _postRepository.GetFeedAsync();
        return posts.Select(MapToDto);
    }

    // Mapeamento manual de Post para PostDto (Rápido, seguro e sem bibliotecas externas)
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

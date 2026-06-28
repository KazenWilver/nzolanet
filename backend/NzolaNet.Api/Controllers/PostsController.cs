using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NzolaNet.Application.DTOs.Posts;
using NzolaNet.Application.DTOs.Publications;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PostsController : ControllerBase
{
    private readonly IPostService _postService;

    public PostsController(IPostService postService)
    {
        _postService = postService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var posts = await _postService.GetAllAsync(GetOptionalCurrentUserId());
        return Ok(posts.Select(ToLegacyPostDto));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var post = await _postService.GetByIdAsync(id, GetOptionalCurrentUserId());
            if (post == null)
            {
                return NotFound(new { Message = "Publicação não encontrada." });
            }

            return Ok(ToLegacyPostDto(post));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpGet("utilizador/{utilizadorId}")]
    public async Task<IActionResult> GetByUserId(Guid utilizadorId)
    {
        try
        {
            var posts = await _postService.GetByUserIdAsync(utilizadorId, GetOptionalCurrentUserId());
            return Ok(posts.Select(ToLegacyPostDto));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
    }

    [Authorize]
    [HttpGet("feed")]
    public async Task<IActionResult> GetFeed()
    {
        var userId = GetCurrentUserId();
        var feed = await _postService.GetFeedAsync(userId);
        return Ok(feed.Select(ToLegacyPostDto));
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreatePostDto createDto)
    {
        var userId = GetCurrentUserId();
        var publicationDto = new CreatePublicationDto
        {
            Text = createDto.Text,
            Image = createDto.Image,
            Video = createDto.Video
        };
        var post = await _postService.CreateAsync(userId, publicationDto);
        return CreatedAtAction(nameof(GetAll), new { id = post.Id }, ToLegacyPostDto(post));
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePostDto updateDto)
    {
        var userId = GetCurrentUserId();
        var post = await _postService.UpdateAsync(userId, id, new UpdatePublicationDto { Text = updateDto.Text });
        return Ok(ToLegacyPostDto(post));
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetCurrentUserId();
        await _postService.DeleteAsync(userId, id);
        return Ok(new { Message = "Publicação eliminada com sucesso." });
    }

    private static PostDto ToLegacyPostDto(PublicationResponseDto publication)
    {
        return new PostDto
        {
            Id = publication.Id,
            UserId = publication.AuthorId,
            UserName = publication.AuthorUsername,
            UserPhoto = publication.AuthorPhotoUrl,
            Text = publication.Text ?? string.Empty,
            ImageUrl = publication.ImageUrl,
            VideoUrl = publication.VideoUrl,
            CreatedAt = publication.CreatedAt,
            CommentsCount = publication.CommentsCount,
            BazesCount = publication.LikesCount,
            UserHasBaze = publication.HasLiked ?? false
        };
    }

    private Guid? GetOptionalCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("sub")?.Value;

        return Guid.TryParse(userIdClaim, out var parsedId) ? parsedId : null;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim))
        {
            throw new UnauthorizedAccessException("Utilizador não autenticado no sistema.");
        }

        return Guid.Parse(userIdClaim);
    }
}

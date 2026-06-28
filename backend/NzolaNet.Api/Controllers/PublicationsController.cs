using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NzolaNet.Application.DTOs.Publications;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Api.Controllers;

[ApiController]
[Route("api/publications")]
public class PublicationsController : ControllerBase
{
    private readonly IPostService _postService;
    private readonly ILikeService _likeService;

    public PublicationsController(IPostService postService, ILikeService likeService)
    {
        _postService = postService;
        _likeService = likeService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var publications = await _postService.GetAllAsync(GetOptionalCurrentUserId());
        return Ok(publications);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var publication = await _postService.GetByIdAsync(id, GetOptionalCurrentUserId());
            if (publication == null)
            {
                return NotFound(new { message = "Publicação não encontrada." });
            }

            return Ok(publication);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUserId(Guid userId)
    {
        try
        {
            var publications = await _postService.GetByUserIdAsync(userId, GetOptionalCurrentUserId());
            return Ok(publications);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreatePublicationDto createDto)
    {
        var userId = GetCurrentUserId();
        var publication = await _postService.CreateAsync(userId, createDto);
        return CreatedAtAction(nameof(GetById), new { id = publication.Id }, publication);
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePublicationDto updateDto)
    {
        var userId = GetCurrentUserId();
        var publication = await _postService.UpdateAsync(userId, id, updateDto);
        return Ok(publication);
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetCurrentUserId();
        await _postService.DeleteAsync(userId, id);
        return NoContent();
    }

    [Authorize]
    [HttpPost("{id}/like")]
    public async Task<IActionResult> Like(Guid id)
    {
        var userId = GetCurrentUserId();
        await _likeService.LikeAsync(userId, id);
        return Ok(new { message = "Baze registado com sucesso." });
    }

    [Authorize]
    [HttpDelete("{id}/like")]
    public async Task<IActionResult> Unlike(Guid id)
    {
        var userId = GetCurrentUserId();
        await _likeService.UnlikeAsync(userId, id);
        return NoContent();
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

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Utilizador não autenticado no sistema.");
        }

        return userId;
    }
}

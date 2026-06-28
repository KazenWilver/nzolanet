using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NzolaNet.Application.DTOs.Comments;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;

    public CommentsController(ICommentService commentService)
    {
        _commentService = commentService;
    }

    [HttpGet("/api/posts/{postId}/comments")]
    public async Task<IActionResult> GetByPostLegacy(Guid postId)
    {
        return await GetCommentsInternal(postId);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var comments = await _commentService.GetAllAsync();
        return Ok(comments);
    }

    [HttpGet("count")]
    public async Task<IActionResult> GetCount()
    {
        var count = await _commentService.GetTotalCountAsync();
        return Ok(new { total = count });
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CreateLegacy([FromBody] CreateCommentLegacyDto createDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = GetCurrentUserId();
        var comment = await _commentService.CreateAsync(
            userId,
            createDto.PostId,
            new CreateCommentDto { Text = createDto.Text });

        return CreatedAtAction(nameof(GetByPostLegacy), new { postId = comment.PublicationId }, ToLegacyDto(comment));
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCommentDto updateDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = GetCurrentUserId();
        var comment = await _commentService.UpdateAsync(userId, id, updateDto);
        return Ok(comment);
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetCurrentUserId();
        var isAdmin = IsCurrentUserAdmin();
        await _commentService.DeleteAsync(userId, id, isAdmin);
        return NoContent();
    }

    private async Task<IActionResult> GetCommentsInternal(Guid publicationId)
    {
        Guid? currentUserId = null;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("sub")?.Value;
        if (Guid.TryParse(userIdClaim, out var parsedId))
        {
            currentUserId = parsedId;
        }

        try
        {
            var comments = await _commentService.GetByPublicationAsync(publicationId, currentUserId);
            return Ok(comments);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    private static CommentDto ToLegacyDto(CommentResponseDto comment)
    {
        return new CommentDto
        {
            Id = comment.Id,
            UserId = comment.AuthorId,
            UserName = comment.AuthorUsername,
            UserPhoto = comment.AuthorPhotoUrl,
            PostId = comment.PublicationId,
            Text = comment.Text,
            CreatedAt = comment.CreatedAt
        };
    }

    private bool IsCurrentUserAdmin()
    {
        return User.Claims.Any(c =>
            (c.Type == "role" || c.Type == ClaimTypes.Role) && c.Value == "Admin");
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

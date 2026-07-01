using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NzolaNet.Api.Helpers;
using NzolaNet.Application.DTOs.Comments;
using NzolaNet.Application.DTOs.Reports;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;
    private readonly IReportService _reportService;

    public CommentsController(ICommentService commentService, IReportService reportService)
    {
        _commentService = commentService;
        _reportService = reportService;
    }

    [HttpGet("/api/posts/{postId}/comments")]
    public async Task<IActionResult> GetByPostLegacy(Guid postId)
    {
        return await GetCommentsInternal(postId);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var comments = await _commentService.GetAllAsync();
        return Ok(comments);
    }

    [Authorize(Roles = "Admin")]
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

        var userId = AuthClaimsHelper.GetUserId(User);
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

        var userId = AuthClaimsHelper.GetUserId(User);
        var comment = await _commentService.UpdateAsync(userId, id, updateDto);
        return Ok(comment);
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = AuthClaimsHelper.GetUserId(User);
        var isAdmin = AuthClaimsHelper.IsAdmin(User);
        await _commentService.DeleteAsync(userId, id, isAdmin);
        return NoContent();
    }

    [Authorize]
    [HttpPost("{id}/report")]
    public async Task<IActionResult> Report(Guid id, [FromBody] ReportContentDto reportDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = AuthClaimsHelper.GetUserId(User);
        try
        {
            await _reportService.ReportCommentAsync(userId, id, reportDto.Reason, reportDto.Details);
            return Ok(new { message = "Denúncia enviada com sucesso." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    private async Task<IActionResult> GetCommentsInternal(Guid publicationId)
    {
        try
        {
            var comments = await _commentService.GetByPublicationAsync(
                publicationId,
                AuthClaimsHelper.GetOptionalUserId(User));
            return Ok(comments);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenResultHelper.Create(ex.Message);
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
}

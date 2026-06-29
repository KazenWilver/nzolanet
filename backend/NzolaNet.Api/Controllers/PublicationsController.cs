using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NzolaNet.Api.Helpers;
using NzolaNet.Application.DTOs.Comments;
using NzolaNet.Application.DTOs.Publications;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Api.Controllers;

[ApiController]
[Route("api/publications")]
public class PublicationsController : ControllerBase
{
    private readonly IPostService _postService;
    private readonly ILikeService _likeService;
    private readonly ICommentService _commentService;

    public PublicationsController(
        IPostService postService,
        ILikeService likeService,
        ICommentService commentService)
    {
        _postService = postService;
        _likeService = likeService;
        _commentService = commentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var publications = await _postService.GetAllAsync(AuthClaimsHelper.GetOptionalUserId(User));
        return Ok(publications);
    }

    [Authorize]
    [HttpGet("feed")]
    public async Task<IActionResult> GetFollowingFeed()
    {
        var userId = AuthClaimsHelper.GetUserId(User);
        var publications = await _postService.GetFollowingFeedAsync(userId);
        return Ok(publications);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var publication = await _postService.GetByIdAsync(id, AuthClaimsHelper.GetOptionalUserId(User));
            if (publication == null)
            {
                return NotFound(new { message = "Publicação não encontrada." });
            }

            return Ok(publication);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenResultHelper.Create(ex.Message);
        }
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUserId(Guid userId)
    {
        try
        {
            var publications = await _postService.GetByUserIdAsync(userId, AuthClaimsHelper.GetOptionalUserId(User));
            return Ok(publications);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenResultHelper.Create(ex.Message);
        }
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreatePublicationDto createDto)
    {
        var userId = AuthClaimsHelper.GetUserId(User);
        var publication = await _postService.CreateAsync(userId, createDto);
        return CreatedAtAction(nameof(GetById), new { id = publication.Id }, publication);
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePublicationDto updateDto)
    {
        var userId = AuthClaimsHelper.GetUserId(User);
        var publication = await _postService.UpdateAsync(userId, id, updateDto);
        return Ok(publication);
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = AuthClaimsHelper.GetUserId(User);
        await _postService.DeleteAsync(userId, id);
        return NoContent();
    }

    [HttpGet("{publicationId}/comments")]
    public async Task<IActionResult> GetComments(Guid publicationId)
    {
        try
        {
            var comments = await _commentService.GetByPublicationAsync(publicationId, AuthClaimsHelper.GetOptionalUserId(User));
            return Ok(comments);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenResultHelper.Create(ex.Message);
        }
    }

    [Authorize]
    [HttpPost("{publicationId}/comments")]
    public async Task<IActionResult> CreateComment(Guid publicationId, [FromBody] CreateCommentDto createDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = AuthClaimsHelper.GetUserId(User);
        var comment = await _commentService.CreateAsync(userId, publicationId, createDto);
        return CreatedAtAction(nameof(GetComments), new { publicationId }, comment);
    }

    [Authorize]
    [HttpPost("{id}/like")]
    public async Task<IActionResult> Like(Guid id)
    {
        var userId = AuthClaimsHelper.GetUserId(User);
        await _likeService.LikeAsync(userId, id);
        return Ok(new { message = "Baze registado com sucesso." });
    }

    [Authorize]
    [HttpDelete("{id}/like")]
    public async Task<IActionResult> Unlike(Guid id)
    {
        var userId = AuthClaimsHelper.GetUserId(User);
        await _likeService.UnlikeAsync(userId, id);
        return NoContent();
    }
}

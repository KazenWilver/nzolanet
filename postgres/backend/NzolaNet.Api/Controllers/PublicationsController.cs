using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NzolaNet.Api.Helpers;
using NzolaNet.Application.DTOs.Comments;
using NzolaNet.Application.DTOs.Publications;
using NzolaNet.Application.DTOs.Reports;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Api.Controllers;

[ApiController]
[Route("api/publications")]
public class PublicationsController : ControllerBase
{
    private readonly IPostService _postService;
    private readonly ILikeService _likeService;
    private readonly ICommentService _commentService;
    private readonly IRepostService _repostService;
    private readonly IBookmarkService _bookmarkService;
    private readonly IReportService _reportService;

    public PublicationsController(
        IPostService postService,
        ILikeService likeService,
        ICommentService commentService,
        IRepostService repostService,
        IBookmarkService bookmarkService,
        IReportService reportService)
    {
        _postService = postService;
        _likeService = likeService;
        _commentService = commentService;
        _repostService = repostService;
        _bookmarkService = bookmarkService;
        _reportService = reportService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? page, [FromQuery] int pageSize = 20)
    {
        if (page.HasValue)
        {
            var safePage = Math.Max(page.Value, 1);
            var safePageSize = Math.Clamp(pageSize, 1, 50);
            var publications = await _postService.GetAllPagedAsync(
                AuthClaimsHelper.GetOptionalUserId(User),
                safePage,
                safePageSize);
            return Ok(publications);
        }

        var allPublications = await _postService.GetAllAsync(AuthClaimsHelper.GetOptionalUserId(User));
        return Ok(allPublications);
    }

    [Authorize]
    [HttpGet("feed")]
    public async Task<IActionResult> GetFollowingFeed([FromQuery] int? page, [FromQuery] int pageSize = 20)
    {
        var userId = AuthClaimsHelper.GetUserId(User);

        if (page.HasValue)
        {
            var safePage = Math.Max(page.Value, 1);
            var safePageSize = Math.Clamp(pageSize, 1, 50);
            var publications = await _postService.GetFollowingFeedPagedAsync(userId, safePage, safePageSize);
            return Ok(publications);
        }

        var feed = await _postService.GetFollowingFeedAsync(userId);
        return Ok(feed);
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

    [HttpGet("hashtag/{tag}")]
    public async Task<IActionResult> GetByHashtag(
        string tag,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var safePage = Math.Max(page, 1);
        var safePageSize = Math.Clamp(pageSize, 1, 50);
        var results = await _postService.GetByHashtagAsync(
            tag,
            AuthClaimsHelper.GetOptionalUserId(User),
            safePage,
            safePageSize);
        return Ok(results);
    }

    [HttpGet("trending-hashtags")]
    public async Task<IActionResult> GetTrendingHashtags([FromQuery] int limit = 5)
    {
        var hashtags = await _postService.GetTrendingHashtagsAsync(limit);
        return Ok(hashtags);
    }

    [HttpGet("user/{userId}/reposts")]
    public async Task<IActionResult> GetUserReposts(
        Guid userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var safePage = Math.Max(page, 1);
            var safePageSize = Math.Clamp(pageSize, 1, 50);
            var publications = await _postService.GetUserRepostsPagedAsync(
                userId,
                AuthClaimsHelper.GetOptionalUserId(User),
                safePage,
                safePageSize);
            return Ok(publications);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenResultHelper.Create(ex.Message);
        }
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUserId(
        Guid userId,
        [FromQuery] int? page,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool mediaOnly = false)
    {
        try
        {
            if (page.HasValue)
            {
                var safePage = Math.Max(page.Value, 1);
                var safePageSize = Math.Clamp(pageSize, 1, 50);
                var publications = await _postService.GetByUserIdPagedAsync(
                    userId,
                    AuthClaimsHelper.GetOptionalUserId(User),
                    safePage,
                    safePageSize,
                    mediaOnly);
                return Ok(publications);
            }

            var allPublications = await _postService.GetByUserIdAsync(userId, AuthClaimsHelper.GetOptionalUserId(User));
            return Ok(allPublications);
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
        await _postService.DeleteAsync(userId, id, AuthClaimsHelper.IsAdmin(User));
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
    [Consumes("multipart/form-data")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<IActionResult> CreateComment(
        Guid publicationId,
        [FromForm] string? text,
        [FromForm] IFormFile? image,
        [FromForm] IFormFile? video)
    {
        var userId = AuthClaimsHelper.GetUserId(User);
        var comment = await _commentService.CreateWithMediaAsync(userId, publicationId, text, image, video);
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

    [Authorize]
    [HttpPost("{id}/repost")]
    public async Task<IActionResult> Repost(Guid id, [FromBody] RepostPublicationDto? dto)
    {
        try
        {
            var userId = AuthClaimsHelper.GetUserId(User);
            var (isReposted, repostsCount, quotedPublication, removedQuotedPublicationIds) = await _repostService.RepostAsync(
                userId,
                id,
                dto?.Text);
            return Ok(new { hasReposted = isReposted, repostsCount, quotedPublication, removedQuotedPublicationIds });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize]
    [HttpPost("{id}/bookmark")]
    public async Task<IActionResult> Bookmark(Guid id)
    {
        var userId = AuthClaimsHelper.GetUserId(User);
        await _bookmarkService.ToggleBookmarkAsync(userId, id, bookmark: true);
        return NoContent();
    }

    [Authorize]
    [HttpDelete("{id}/bookmark")]
    public async Task<IActionResult> RemoveBookmark(Guid id)
    {
        var userId = AuthClaimsHelper.GetUserId(User);
        await _bookmarkService.ToggleBookmarkAsync(userId, id, bookmark: false);
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
            await _reportService.ReportPostAsync(userId, id, reportDto.Reason, reportDto.Details);
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
}

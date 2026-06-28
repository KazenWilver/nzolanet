using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NzolaNet.Api.Helpers;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LikesController : ControllerBase
{
    private readonly ILikeService _likeService;

    public LikesController(ILikeService likeService)
    {
        _likeService = likeService;
    }

    [HttpPost("{postId}")]
    public async Task<IActionResult> ToggleLike(Guid postId)
    {
        var userId = AuthClaimsHelper.GetUserId(User);
        try
        {
            var result = await _likeService.ToggleLikeAsync(userId, postId);
            var count = await _likeService.GetLikeCountAsync(postId);
            var hasLiked = await _likeService.HasUserLikedAsync(userId, postId);

            return Ok(new
            {
                Success = true,
                Message = result ? "Operação concluída com sucesso." : "Não foi possível processar o like.",
                LikeCount = count,
                IsLiked = hasLiked
            });
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
    }
}

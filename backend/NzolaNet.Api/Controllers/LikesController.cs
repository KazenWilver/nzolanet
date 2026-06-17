using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

    // POST /api/likes/{postId} – Dar ou remover um "Baze" (like) numa publicação
    [HttpPost("{postId}")]
    public async Task<IActionResult> ToggleLike(Guid postId)
    {
        var userId = GetCurrentUserId();
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

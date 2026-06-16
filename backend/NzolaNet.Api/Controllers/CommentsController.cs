using System;
using System.Security.Claims;
using System.Threading.Tasks;
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

    // Obter os comentários de uma publicação
    [HttpGet("post/{postId}")]
    public async Task<IActionResult> GetByPostId(Guid postId)
    {
        try
        {
            var comments = await _commentService.GetByPostIdAsync(postId);
            return Ok(comments);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "Ocorreu um erro interno no servidor." });
        }
    }

    // Criar um comentário numa publicação (requer autenticação)
    [Authorize]
    [HttpPost("post/{postId}")]
    public async Task<IActionResult> Create(Guid postId, [FromBody] CreateCommentDto createDto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var comment = await _commentService.CreateAsync(userId, postId, createDto);
            return CreatedAtAction(nameof(GetByPostId), new { postId = comment.PostId }, comment);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "Ocorreu um erro interno no servidor." });
        }
    }

    // Eliminar um comentário (apenas o autor pode eliminar)
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var deleted = await _commentService.DeleteAsync(userId, id);
            if (deleted)
            {
                return Ok(new { Message = "Comentário eliminado com sucesso." });
            }
            return BadRequest(new { Message = "Não foi possível eliminar o comentário." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "Ocorreu um erro interno no servidor." });
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

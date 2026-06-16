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

    // GET /api/posts/{postId}/comments – listar comentários de uma publicação
    [HttpGet("/api/posts/{postId}/comments")]
    public async Task<IActionResult> GetByPost(Guid postId)
    {
        try
        {
            var comments = await _commentService.GetByPostAsync(postId);
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

    // POST /api/comments – adicionar comentário (requer autenticação)
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCommentDto createDto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var comment = await _commentService.CreateAsync(userId, createDto);
            return CreatedAtAction(nameof(GetByPost), new { postId = comment.PostId }, comment);
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

    // PUT /api/comments/{id} – editar apenas o próprio comentário (requer autenticação)
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCommentDto updateDto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var comment = await _commentService.UpdateAsync(userId, id, updateDto);
            return Ok(comment);
        }
        catch (UnauthorizedAccessException)
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

    // DELETE /api/comments/{id} – excluir apenas o próprio comentário (requer autenticação)
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
        catch (UnauthorizedAccessException)
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

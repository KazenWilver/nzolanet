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
        var comments = await _commentService.GetByPostAsync(postId);
        return Ok(comments);
    }

    // POST /api/comments – adicionar comentário (requer autenticação)
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCommentDto createDto)
    {
        var userId = GetCurrentUserId();
        var comment = await _commentService.CreateAsync(userId, createDto);
        return CreatedAtAction(nameof(GetByPost), new { postId = comment.PostId }, comment);
    }

    // PUT /api/comments/{id} – editar apenas o próprio comentário (requer autenticação)
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCommentDto updateDto)
    {
        var userId = GetCurrentUserId();
        var comment = await _commentService.UpdateAsync(userId, id, updateDto);
        return Ok(comment);
    }

    // DELETE /api/comments/{id} – excluir apenas o próprio comentário (requer autenticação)
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetCurrentUserId();
        var deleted = await _commentService.DeleteAsync(userId, id);
        if (deleted)
        {
            return Ok(new { Message = "Comentário eliminado com sucesso." });
        }
        return BadRequest(new { Message = "Não foi possível eliminar o comentário." });
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

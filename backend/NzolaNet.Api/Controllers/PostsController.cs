using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NzolaNet.Application.DTOs.Posts;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PostsController : ControllerBase
{
    private readonly IPostService _postService;

    public PostsController(IPostService postService)
    {
        _postService = postService;
    }

    // Obter o feed de publicações (ordem cronológica, mais recentes primeiro)
    [HttpGet("feed")]
    public async Task<IActionResult> GetFeed()
    {
        try
        {
            var feed = await _postService.GetFeedAsync();
            return Ok(feed);
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "Ocorreu um erro interno no servidor." });
        }
    }

    // Criar uma nova publicação (requer autenticação)
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreatePostDto createDto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var post = await _postService.CreateAsync(userId, createDto);
            return CreatedAtAction(nameof(GetFeed), new { id = post.Id }, post);
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

    // Editar uma publicação existente (apenas o dono pode editar)
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePostDto updateDto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var post = await _postService.UpdateAsync(userId, id, updateDto);
            return Ok(post);
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

    // Eliminar uma publicação (apenas o dono pode eliminar)
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var deleted = await _postService.DeleteAsync(userId, id);
            if (deleted)
            {
                return Ok(new { Message = "Publicação eliminada com sucesso." });
            }
            return BadRequest(new { Message = "Não foi possível eliminar a publicação." });
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

    // Método auxiliar para extrair o ID do utilizador autenticado no JWT
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

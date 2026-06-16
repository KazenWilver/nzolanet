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

    // Listar TODAS as publicações em ordem cronológica (público)
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var posts = await _postService.GetAllAsync();
            return Ok(posts);
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "Ocorreu um erro interno no servidor." });
        }
    }

    // Listar publicações de utilizadores seguidos em ordem cronológica (requer autenticação)
    [Authorize]
    [HttpGet("feed")]
    public async Task<IActionResult> GetFeed()
    {
        try
        {
            var userId = GetCurrentUserId();
            var feed = await _postService.GetFeedAsync(userId);
            return Ok(feed);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { Message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "Ocorreu um erro interno no servidor." });
        }
    }

    // Criar uma nova publicação com upload de imagem/vídeo (requer autenticação)
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreatePostDto createDto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var post = await _postService.CreateAsync(userId, createDto);
            return CreatedAtAction(nameof(GetAll), new { id = post.Id }, post);
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

    // Editar apenas o texto da própria publicação (requer autenticação)
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

    // Eliminar apenas a própria publicação (requer autenticação)
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

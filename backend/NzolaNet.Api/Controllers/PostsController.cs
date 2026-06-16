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

    // GET /api/posts – Listar TODAS as publicações em ordem cronológica (público)
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        Guid? currentUserId = null;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                       ?? User.FindFirst("sub")?.Value;
        if (Guid.TryParse(userIdClaim, out var parsedId))
        {
            currentUserId = parsedId;
        }

        var posts = await _postService.GetAllAsync(currentUserId);
        return Ok(posts);
    }

    // GET /api/posts/{id} – Obter uma publicação específica por ID
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        Guid? currentUserId = null;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                       ?? User.FindFirst("sub")?.Value;
        if (Guid.TryParse(userIdClaim, out var parsedId))
        {
            currentUserId = parsedId;
        }

        var post = await _postService.GetByIdAsync(id, currentUserId);
        if (post == null)
        {
            return NotFound(new { Message = "Publicação não encontrada." });
        }

        return Ok(post);
    }

    // GET /api/posts/utilizador/{utilizadorId} – Listar publicações de um utilizador específico (suporta privado)
    [HttpGet("utilizador/{utilizadorId}")]
    public async Task<IActionResult> GetByUserId(Guid utilizadorId)
    {
        Guid? currentUserId = null;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                       ?? User.FindFirst("sub")?.Value;
        if (Guid.TryParse(userIdClaim, out var parsedId))
        {
            currentUserId = parsedId;
        }

        try
        {
            var posts = await _postService.GetByUserIdAsync(utilizadorId, currentUserId);
            return Ok(posts);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(); // Ou StatusCode(403, new { Message = ex.Message })
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { Message = ex.Message });
        }
    }

    // GET /api/posts/feed – Listar publicações de utilizadores seguidos em ordem cronológica (requer autenticação)
    [Authorize]
    [HttpGet("feed")]
    public async Task<IActionResult> GetFeed()
    {
        var userId = GetCurrentUserId();
        var feed = await _postService.GetFeedAsync(userId);
        return Ok(feed);
    }

    // POST /api/posts – Criar uma nova publicação com upload de imagem/vídeo (requer autenticação)
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CreatePostDto createDto)
    {
        var userId = GetCurrentUserId();
        var post = await _postService.CreateAsync(userId, createDto);
        return CreatedAtAction(nameof(GetAll), new { id = post.Id }, post);
    }

    // PUT /api/posts/{id} – Editar apenas o texto da própria publicação (requer autenticação)
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePostDto updateDto)
    {
        var userId = GetCurrentUserId();
        var post = await _postService.UpdateAsync(userId, id, updateDto);
        return Ok(post);
    }

    // DELETE /api/posts/{id} – Eliminar apenas a própria publicação (requer autenticação)
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetCurrentUserId();
        var deleted = await _postService.DeleteAsync(userId, id);
        if (deleted)
        {
            return Ok(new { Message = "Publicação eliminada com sucesso." });
        }
        return BadRequest(new { Message = "Não foi possível eliminar a publicação." });
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

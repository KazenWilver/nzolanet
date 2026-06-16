using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NzolaNet.Application.DTOs.Users;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    // Obter perfil público do utilizador
    [HttpGet("{id}")]
    public async Task<IActionResult> GetProfile(Guid id)
    {
        try
        {
            var profile = await _userService.GetProfileAsync(id);
            return Ok(profile);
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

    // Editar perfil do utilizador autenticado
    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto updateDto)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var updatedProfile = await _userService.UpdateProfileAsync(currentUserId, updateDto);
            return Ok(updatedProfile);
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

    // Upload de foto de perfil
    [Authorize]
    [HttpPost("photo")]
    public async Task<IActionResult> UploadPhoto([FromForm] IFormFile photoFile)
    {
        try
        {
            if (photoFile == null || photoFile.Length == 0)
            {
                return BadRequest(new { Message = "Por favor, envie um ficheiro de imagem válido." });
            }

            var currentUserId = GetCurrentUserId();
            var photoPath = await _userService.UploadPhotoAsync(currentUserId, photoFile);
            return Ok(new { PhotoPath = photoPath, Message = "Foto de perfil atualizada com sucesso!" });
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

    // Seguir um utilizador
    [Authorize]
    [HttpPost("{id}/follow")]
    public async Task<IActionResult> FollowUser(Guid id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var success = await _userService.FollowUserAsync(currentUserId, id);
            if (success)
            {
                return Ok(new { Message = "Começou a seguir o utilizador com sucesso." });
            }
            return BadRequest(new { Message = "Não foi possível seguir o utilizador." });
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

    // Deixar de seguir um utilizador
    [Authorize]
    [HttpDelete("{id}/follow")]
    public async Task<IActionResult> UnfollowUser(Guid id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var success = await _userService.UnfollowUserAsync(currentUserId, id);
            if (success)
            {
                return Ok(new { Message = "Deixou de seguir o utilizador com sucesso." });
            }
            return BadRequest(new { Message = "Não foi possível deixar de seguir o utilizador." });
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

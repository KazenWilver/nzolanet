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

    // GET /api/users/{id} – Obter perfil público do utilizador
    [HttpGet("{id}")]
    public async Task<IActionResult> GetProfile(Guid id)
    {
        var profile = await _userService.GetProfileAsync(id);
        return Ok(profile);
    }

    // PUT /api/users/profile – Editar perfil do utilizador autenticado
    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto updateDto)
    {
        var currentUserId = GetCurrentUserId();
        var updatedProfile = await _userService.UpdateProfileAsync(currentUserId, updateDto);
        return Ok(updatedProfile);
    }

    // POST /api/users/photo – Upload de foto de perfil (requer autenticação)
    [Authorize]
    [HttpPost("photo")]
    public async Task<IActionResult> UploadPhoto([FromForm] IFormFile photoFile)
    {
        if (photoFile == null || photoFile.Length == 0)
        {
            return BadRequest(new { Message = "Por favor, envie um ficheiro de imagem válido." });
        }

        var currentUserId = GetCurrentUserId();
        var photoPath = await _userService.UploadPhotoAsync(currentUserId, photoFile);
        return Ok(new { PhotoPath = photoPath, Message = "Foto de perfil atualizada com sucesso!" });
    }

    // POST /api/users/{id}/follow – Seguir um utilizador (requer autenticação)
    [Authorize]
    [HttpPost("{id}/follow")]
    public async Task<IActionResult> FollowUser(Guid id)
    {
        var currentUserId = GetCurrentUserId();
        var success = await _userService.FollowUserAsync(currentUserId, id);
        if (success)
        {
            return Ok(new { Message = "Começou a seguir o utilizador com sucesso." });
        }
        return BadRequest(new { Message = "Não foi possível seguir o utilizador." });
    }

    // DELETE /api/users/{id}/follow – Deixar de seguir um utilizador (requer autenticação)
    [Authorize]
    [HttpDelete("{id}/follow")]
    public async Task<IActionResult> UnfollowUser(Guid id)
    {
        var currentUserId = GetCurrentUserId();
        var success = await _userService.UnfollowUserAsync(currentUserId, id);
        if (success)
        {
            return Ok(new { Message = "Deixou de seguir o utilizador com sucesso." });
        }
        return BadRequest(new { Message = "Não foi possível deixar de seguir o utilizador." });
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

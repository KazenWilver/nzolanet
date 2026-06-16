using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NzolaNet.Application.DTOs.Auth;
using NzolaNet.Application.DTOs.Users;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Interfaces.Repositories;

namespace NzolaNet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUserRepository _userRepository;

    public AuthController(IAuthService authService, IUserRepository userRepository)
    {
        _authService = authService;
        _userRepository = userRepository;
    }

    // POST /api/auth/register – Registo de novo utilizador
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        var token = await _authService.RegisterAsync(registerDto);
        var user = await _userRepository.GetByUsernameAsync(registerDto.Username);
        
        if (user == null)
        {
            return BadRequest(new { Message = "Erro ao recuperar dados do utilizador após registo." });
        }

        var userDto = new UserDto
        {
            Id = user.Id,
            Username = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            ProfilePhoto = user.ProfilePhoto,
            IsPrivate = user.IsPrivate,
            Bio = user.Bio,
            CreatedAt = user.CreatedAt
        };

        return Ok(new 
        { 
            Token = token, 
            Utilizador = userDto,
            Message = "Utilizador registado com sucesso!" 
        });
    }

    // POST /api/auth/login – Login de utilizador
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        var token = await _authService.LoginAsync(loginDto);
        
        // Obter utilizador por username ou email
        var identifier = loginDto.UsernameOrEmail;
        var user = identifier.Contains("@") 
            ? await _userRepository.GetByEmailAsync(identifier)
            : await _userRepository.GetByUsernameAsync(identifier);

        if (user == null)
        {
            return BadRequest(new { Message = "Erro ao recuperar dados do utilizador." });
        }

        var userDto = new UserDto
        {
            Id = user.Id,
            Username = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            ProfilePhoto = user.ProfilePhoto,
            IsPrivate = user.IsPrivate,
            Bio = user.Bio,
            CreatedAt = user.CreatedAt
        };

        return Ok(new 
        { 
            Token = token, 
            Utilizador = userDto,
            Message = "Login efetuado com sucesso!" 
        });
    }

    // GET /api/auth/me – Obter perfil do utilizador autenticado
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                       ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { Message = "Utilizador não autenticado no sistema." });
        }

        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { Message = "Utilizador não encontrado." });
        }

        var userDto = new UserDto
        {
            Id = user.Id,
            Username = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            ProfilePhoto = user.ProfilePhoto,
            IsPrivate = user.IsPrivate,
            Bio = user.Bio,
            CreatedAt = user.CreatedAt
        };

        return Ok(userDto);
    }
}

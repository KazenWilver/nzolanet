using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using NzolaNet.Application.DTOs.Auth;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    // POST /api/auth/register – Registo de novo utilizador
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        var token = await _authService.RegisterAsync(registerDto);
        return Ok(new { Token = token, Message = "Utilizador registado com sucesso!" });
    }

    // POST /api/auth/login – Login de utilizador
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        var token = await _authService.LoginAsync(loginDto);
        return Ok(new { Token = token, Message = "Login efetuado com sucesso!" });
    }
}

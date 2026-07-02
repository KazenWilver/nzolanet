using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NzolaNet.Api.Helpers;
using NzolaNet.Application.DTOs.Auth;
using NzolaNet.Application.Interfaces;
using NzolaNet.Application.Services.Fimbu;

namespace NzolaNet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IFimbuMoodService _fimbuMoodService;

    public AuthController(IAuthService authService, IFimbuMoodService fimbuMoodService)
    {
        _authService = authService;
        _fimbuMoodService = fimbuMoodService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var response = await _authService.RegisterAsync(registerDto);

        // Novo utilizador = primeira sessão = sorteia já a personalidade da
        // Fimbu para quando ele abrir o chat pela primeira vez.
        _fimbuMoodService.AssignNewSessionMood(response.User.Id);

        return CreatedAtAction(nameof(Register), new { id = response.User.Id }, response);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var response = await _authService.LoginAsync(loginDto);

        // Cada login bem-sucedido força uma personalidade nova da Fimbu para
        // esta sessão, diferente da anterior. Feito aqui em vez de num
        // endpoint de logout porque, com JWT, o logout é normalmente só o
        // frontend a apagar o token — nada garante que o backend seja
        // avisado. Fazer o sorteio no login garante que funciona sempre.
        _fimbuMoodService.AssignNewSessionMood(response.User.Id);

        return Ok(response);
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto forgotPasswordDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var response = await _authService.ForgotPasswordAsync(forgotPasswordDto);
        return Ok(response);
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto resetPasswordDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var message = await _authService.ResetPasswordAsync(resetPasswordDto);
            return Ok(new { message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize]
    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = AuthClaimsHelper.GetUserId(User);
        var message = await _authService.ChangePasswordAsync(userId, changePasswordDto);
        return Ok(new { message });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser([FromServices] IUserService userService)
    {
        var userId = AuthClaimsHelper.GetUserId(User);
        var user = await userService.GetUserResponseAsync(userId, userId);
        return Ok(user);
    }
}
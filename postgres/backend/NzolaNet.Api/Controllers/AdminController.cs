using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NzolaNet.Api.Helpers;
using NzolaNet.Application.DTOs.Admin;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Api.Controllers;

/// <summary>
/// Exposes the administrator authentication and moderation endpoints. Every
/// endpoint other than login and registration requires the caller to hold the
/// <c>Admin</c> role.
/// </summary>
[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] AdminLoginDto loginDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var response = await _adminService.LoginAsync(loginDto);
        return Ok(response);
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] AdminRegisterDto registerDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var response = await _adminService.RegisterAsync(registerDto);
        return Ok(response);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("verify-access")]
    public IActionResult VerifyAccess()
    {
        return Ok(new { message = "Acesso de administrador confirmado." });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics()
    {
        var metrics = await _adminService.GetMetricsAsync();
        return Ok(metrics);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("comments/reported")]
    public async Task<IActionResult> GetReportedComments()
    {
        var comments = await _adminService.GetReportedCommentsAsync();
        return Ok(comments);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("publications/reported")]
    public async Task<IActionResult> GetReportedPublications()
    {
        var publications = await _adminService.GetReportedPublicationsAsync();
        return Ok(publications);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("comments/{id}")]
    public async Task<IActionResult> RemoveComment(Guid id)
    {
        await _adminService.RemoveCommentAsync(id);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("comments/{id}/dismiss")]
    public async Task<IActionResult> DismissCommentReports(Guid id)
    {
        await _adminService.DismissCommentReportsAsync(id);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("publications/{id}")]
    public async Task<IActionResult> RemovePublication(Guid id)
    {
        await _adminService.RemovePublicationAsync(id);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("publications/{id}/dismiss")]
    public async Task<IActionResult> DismissPublicationReports(Guid id)
    {
        await _adminService.DismissPublicationReportsAsync(id);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _adminService.GetUsersAsync();
        return Ok(users);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("users/online")]
    public async Task<IActionResult> GetOnlineUsers()
    {
        var users = await _adminService.GetOnlineUsersAsync();
        return Ok(users);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("feedback")]
    public async Task<IActionResult> GetFeedback([FromServices] IFeedbackService feedbackService)
    {
        var feedback = await feedbackService.GetAllAsync();
        return Ok(feedback);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("users/{id:guid}/deactivate")]
    public async Task<IActionResult> DeactivateUser(Guid id)
    {
        await _adminService.DeactivateUserAsync(AuthClaimsHelper.GetUserId(User), id);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("users/{id:guid}/reactivate")]
    public async Task<IActionResult> ReactivateUser(Guid id)
    {
        await _adminService.ReactivateUserAsync(AuthClaimsHelper.GetUserId(User), id);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("users/{id:guid}/ban")]
    public async Task<IActionResult> BanUser(Guid id)
    {
        await _adminService.BanUserAsync(AuthClaimsHelper.GetUserId(User), id);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("users/{id:guid}/unban")]
    public async Task<IActionResult> UnbanUser(Guid id)
    {
        await _adminService.UnbanUserAsync(AuthClaimsHelper.GetUserId(User), id);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        await _adminService.DeleteUserAsync(AuthClaimsHelper.GetUserId(User), id);
        return NoContent();
    }
}

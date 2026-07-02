using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NzolaNet.Api.Helpers;
using NzolaNet.Application.DTOs.Admin;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Api.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] AdminLoginDto loginDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var response = await _adminService.LoginAsync(loginDto);
        return Ok(new { token = response.Token });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] AdminRegisterDto registerDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var response = await _adminService.RegisterAdminAsync(registerDto);
        return Ok(new { token = response.Token });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("verify-access")]
    public IActionResult VerifyAccess()
    {
        return Ok(new { message = "Acesso autorizado." });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics([FromQuery] string periodoRanking = "30d")
    {
        var metrics = await _adminService.GetMetricsAsync(periodoRanking);
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
    public async Task<IActionResult> DeleteComment(Guid id)
    {
        var adminUserId = AuthClaimsHelper.GetUserId(User);
        await _adminService.DeleteCommentAsync(adminUserId, id);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("publications/{id}")]
    public async Task<IActionResult> DeletePublication(Guid id)
    {
        var adminUserId = AuthClaimsHelper.GetUserId(User);
        await _adminService.DeletePublicationAsync(adminUserId, id);
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("publications/{id}/dismiss")]
    public async Task<IActionResult> DismissPublicationReports(Guid id)
    {
        var adminUserId = AuthClaimsHelper.GetUserId(User);
        await _adminService.DismissPublicationReportsAsync(adminUserId, id);
        return NoContent();
    }
}

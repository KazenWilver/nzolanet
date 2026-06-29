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

    [Authorize(Roles = "Admin")]
    [HttpGet("verify-access")]
    public IActionResult VerifyAccess()
    {
        return Ok(new { message = "Acesso autorizado." });
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
    [HttpDelete("comments/{id}")]
    public async Task<IActionResult> DeleteComment(Guid id)
    {
        var adminUserId = AuthClaimsHelper.GetUserId(User);
        await _adminService.DeleteCommentAsync(adminUserId, id);
        return NoContent();
    }
}

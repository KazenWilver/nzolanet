using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NzolaNet.Api.Helpers;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Api.Controllers;

/// <summary>
/// Serve ficheiros de upload com autenticação e verificação de privacidade.
/// </summary>
[ApiController]
[Route("uploads")]
public class UploadsController : ControllerBase
{
    private readonly IMediaAccessService _mediaAccessService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IWebHostEnvironment _environment;

    public UploadsController(
        IMediaAccessService mediaAccessService,
        IJwtTokenService jwtTokenService,
        IWebHostEnvironment environment)
    {
        _mediaAccessService = mediaAccessService;
        _jwtTokenService = jwtTokenService;
        _environment = environment;
    }

    [HttpGet("{**relativePath}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetUpload(
        string relativePath,
        [FromQuery(Name = "access_token")] string? accessToken)
    {
        if (string.IsNullOrWhiteSpace(relativePath) ||
            relativePath.Contains("..", StringComparison.Ordinal) ||
            relativePath.Contains('\\', StringComparison.Ordinal))
        {
            return NotFound();
        }

        var userId = AuthClaimsHelper.GetOptionalUserId(User)
            ?? _jwtTokenService.TryGetUserIdFromToken(accessToken ?? string.Empty);

        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var normalizedPath = $"/uploads/{relativePath.Replace('\\', '/')}";

        if (!await _mediaAccessService.CanAccessAsync(userId.Value, normalizedPath))
        {
            return NotFound();
        }

        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var physicalPath = Path.GetFullPath(Path.Combine(webRoot, "uploads", relativePath));
        var uploadsRoot = Path.GetFullPath(Path.Combine(webRoot, "uploads"));

        if (!physicalPath.StartsWith(uploadsRoot, StringComparison.OrdinalIgnoreCase) || !System.IO.File.Exists(physicalPath))
        {
            return NotFound();
        }

        var contentType = GetContentType(physicalPath);
        return PhysicalFile(physicalPath, contentType, enableRangeProcessing: true);
    }

    private static string GetContentType(string filePath)
    {
        var extension = Path.GetExtension(filePath).ToLowerInvariant();

        return extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".mp4" => "video/mp4",
            ".webm" => "video/webm",
            ".mov" => "video/quicktime",
            _ => "application/octet-stream"
        };
    }
}

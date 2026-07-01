using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NzolaNet.Api.Helpers;
using NzolaNet.Application.Helpers;
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
        [FromQuery(Name = "access_token")] string? accessToken,
        [FromQuery] bool download = false,
        [FromQuery] string? filename = null)
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

        var physicalPath = ResolvePhysicalPath(relativePath);
        if (physicalPath == null)
        {
            return NotFound();
        }

        var contentType = GetContentType(physicalPath);

        if (download)
        {
            var downloadName = string.IsNullOrWhiteSpace(filename)
                ? Path.GetFileName(physicalPath)
                : filename;

            return PhysicalFile(physicalPath, contentType, fileDownloadName: downloadName, enableRangeProcessing: true);
        }

        return PhysicalFile(physicalPath, contentType, enableRangeProcessing: true);
    }

    private string? ResolvePhysicalPath(string relativePath)
    {
        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var normalizedRelative = relativePath.Replace('\\', '/');

        var uploadsCandidate = Path.GetFullPath(Path.Combine(webRoot, "uploads", normalizedRelative));
        var uploadsRoot = Path.GetFullPath(Path.Combine(webRoot, "uploads"));

        if (uploadsCandidate.StartsWith(uploadsRoot, StringComparison.OrdinalIgnoreCase) &&
            System.IO.File.Exists(uploadsCandidate))
        {
            return uploadsCandidate;
        }

        if (normalizedRelative.StartsWith("messages/", StringComparison.OrdinalIgnoreCase))
        {
            var legacyFileName = normalizedRelative["messages/".Length..];
            var legacyCandidate = Path.GetFullPath(Path.Combine(webRoot, "messages", legacyFileName));
            var legacyRoot = Path.GetFullPath(Path.Combine(webRoot, "messages"));

            if (legacyCandidate.StartsWith(legacyRoot, StringComparison.OrdinalIgnoreCase) &&
                System.IO.File.Exists(legacyCandidate))
            {
                return legacyCandidate;
            }
        }

        return null;
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
            ".pdf" => "application/pdf",
            ".txt" => "text/plain",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".ppt" => "application/vnd.ms-powerpoint",
            ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ".mp3" => "audio/mpeg",
            ".wav" => "audio/wav",
            ".ogg" => "audio/ogg",
            ".m4a" => "audio/mp4",
            _ => "application/octet-stream"
        };
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NzolaNet.Api.Helpers;
using NzolaNet.Application.DTOs.Users;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IPostService _postService;

    public UsersController(IUserService userService, IPostService postService)
    {
        _userService = userService;
        _postService = postService;
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        var users = await _userService.SearchUsersAsync(
            q ?? string.Empty,
            AuthClaimsHelper.GetOptionalUserId(User));
        return Ok(users);
    }

    [Authorize]
    [HttpGet("suggestions")]
    public async Task<IActionResult> GetSuggestions([FromQuery] int count = 3, [FromQuery] string? exclude = null)
    {
        var currentUserId = AuthClaimsHelper.GetUserId(User);
        var safeCount = Math.Clamp(count, 1, 10);
        var excludeIds = ParseGuidList(exclude);
        var suggestions = await _userService.GetSuggestionsAsync(currentUserId, safeCount, excludeIds);
        return Ok(suggestions);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProfile(Guid id)
    {
        var profile = await _userService.GetUserResponseAsync(id, AuthClaimsHelper.GetOptionalUserId(User));
        return Ok(profile);
    }

    [HttpGet("{id}/liked-publications")]
    public async Task<IActionResult> GetLikedPublications(Guid id)
    {
        try
        {
            var publications = await _postService.GetLikedByUserIdAsync(
                id,
                AuthClaimsHelper.GetOptionalUserId(User));
            return Ok(publications);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenResultHelper.Create(ex.Message);
        }
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProfile(Guid id, [FromBody] UpdateProfileDto updateDto)
    {
        if (!IsCurrentUser(id))
        {
            return ForbiddenResultHelper.Create();
        }

        var updatedProfile = await _userService.UpdateProfileAsync(id, updateDto);
        return Ok(updatedProfile);
    }

    [Authorize]
    [HttpPut("{id}/photo")]
    public async Task<IActionResult> UploadPhoto(Guid id, IFormFile photo)
    {
        if (!IsCurrentUser(id))
        {
            return ForbiddenResultHelper.Create();
        }

        if (photo == null || photo.Length == 0)
        {
            return BadRequest(new { message = "Por favor, envie um ficheiro de imagem válido." });
        }

        var user = await _userService.UploadPhotoAsync(id, photo);
        return Ok(user);
    }

    [Authorize]
    [HttpPut("{id}/cover")]
    public async Task<IActionResult> UploadCoverPhoto(Guid id, IFormFile photo)
    {
        if (!IsCurrentUser(id))
        {
            return ForbiddenResultHelper.Create();
        }

        if (photo == null || photo.Length == 0)
        {
            return BadRequest(new { message = "Por favor, envie um ficheiro de imagem válido." });
        }

        var user = await _userService.UploadCoverPhotoAsync(id, photo);
        return Ok(user);
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfileLegacy([FromBody] UpdateProfileDto updateDto)
    {
        var currentUserId = AuthClaimsHelper.GetUserId(User);
        var updatedProfile = await _userService.UpdateProfileAsync(currentUserId, updateDto);
        return Ok(updatedProfile);
    }

    [Authorize]
    [HttpPost("photo")]
    public async Task<IActionResult> UploadPhotoLegacy(IFormFile photoFile)
    {
        if (photoFile == null || photoFile.Length == 0)
        {
            return BadRequest(new { message = "Por favor, envie um ficheiro de imagem válido." });
        }

        var currentUserId = AuthClaimsHelper.GetUserId(User);
        var user = await _userService.UploadPhotoAsync(currentUserId, photoFile);
        return Ok(user);
    }

    [Authorize]
    [HttpPost("{id}/follow")]
    public async Task<IActionResult> FollowUser(Guid id)
    {
        var currentUserId = AuthClaimsHelper.GetUserId(User);
        await _userService.FollowUserAsync(currentUserId, id);
        return Ok(new { message = "Utilizador seguido com sucesso." });
    }

    [Authorize]
    [HttpDelete("{id}/follow")]
    public async Task<IActionResult> UnfollowUser(Guid id)
    {
        var currentUserId = AuthClaimsHelper.GetUserId(User);
        await _userService.UnfollowUserAsync(currentUserId, id);
        return Ok(new { message = "Deixou de seguir o utilizador com sucesso." });
    }

    [HttpGet("{id}/followers")]
    public async Task<IActionResult> GetFollowers(Guid id)
    {
        return await GetFollowersInternal(id);
    }

    [HttpGet("{id}/seguidores")]
    public async Task<IActionResult> GetFollowersLegacy(Guid id)
    {
        return await GetFollowersInternal(id);
    }

    [HttpGet("{id}/following")]
    public async Task<IActionResult> GetFollowing(Guid id)
    {
        return await GetFollowingInternal(id);
    }

    [HttpGet("{id}/seguindo")]
    public async Task<IActionResult> GetFollowingLegacy(Guid id)
    {
        return await GetFollowingInternal(id);
    }

    [Authorize]
    [HttpGet("follow-requests")]
    public async Task<IActionResult> GetPendingRequests()
    {
        var currentUserId = AuthClaimsHelper.GetUserId(User);
        var requests = await _userService.GetPendingRequestsAsync(currentUserId);
        return Ok(requests);
    }

    [Authorize]
    [HttpPost("follow-requests/{followerId}/approve")]
    public async Task<IActionResult> ApproveFollowRequest(Guid followerId)
    {
        var currentUserId = AuthClaimsHelper.GetUserId(User);
        var success = await _userService.ApproveFollowRequestAsync(currentUserId, followerId);
        if (success)
        {
            return Ok(new { message = "Pedido de seguimento aprovado com sucesso." });
        }

        return BadRequest(new { message = "Não foi possível aprovar o pedido de seguimento." });
    }

    [Authorize]
    [HttpPost("follow-requests/{followerId}/reject")]
    public async Task<IActionResult> RejectFollowRequest(Guid followerId)
    {
        var currentUserId = AuthClaimsHelper.GetUserId(User);
        var success = await _userService.RejectFollowRequestAsync(currentUserId, followerId);
        if (success)
        {
            return Ok(new { message = "Pedido de seguimento rejeitado com sucesso." });
        }

        return BadRequest(new { message = "Não foi possível rejeitar o pedido de seguimento." });
    }

    private async Task<IActionResult> GetFollowersInternal(Guid id)
    {
        try
        {
            var followers = await _userService.GetFollowersAsync(
                id,
                AuthClaimsHelper.GetOptionalUserId(User));
            return Ok(followers);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenResultHelper.Create(ex.Message);
        }
    }

    private async Task<IActionResult> GetFollowingInternal(Guid id)
    {
        try
        {
            var following = await _userService.GetFollowingAsync(
                id,
                AuthClaimsHelper.GetOptionalUserId(User));
            return Ok(following);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenResultHelper.Create(ex.Message);
        }
    }

    private bool IsCurrentUser(Guid id)
    {
        return AuthClaimsHelper.GetOptionalUserId(User) == id;
    }

    private static IEnumerable<Guid> ParseGuidList(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return Array.Empty<Guid>();
        }

        return value
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(part => Guid.TryParse(part, out var id) ? id : Guid.Empty)
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();
    }
}

using System.Security.Claims;

namespace NzolaNet.Api.Helpers;

public static class AuthClaimsHelper
{
    public static Guid? GetOptionalUserId(ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirst("sub")?.Value
                       ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        return Guid.TryParse(userIdClaim, out var parsedId) ? parsedId : null;
    }

    public static Guid GetUserId(ClaimsPrincipal user)
    {
        var userId = GetOptionalUserId(user);
        if (!userId.HasValue)
        {
            throw new UnauthorizedAccessException("Utilizador não autenticado no sistema.");
        }

        return userId.Value;
    }

    public static bool IsAdmin(ClaimsPrincipal user)
    {
        return user.Claims.Any(c =>
            (c.Type == "role" || c.Type == ClaimTypes.Role) && c.Value == "Admin");
    }
}

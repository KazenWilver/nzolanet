using NzolaNet.Domain.Entities;

namespace NzolaNet.Application.Interfaces;

public interface IJwtTokenService
{
    /// <summary>
    /// Generates a JWT for the given user including role claims.
    /// </summary>
    Task<string> GenerateTokenAsync(User user);
}

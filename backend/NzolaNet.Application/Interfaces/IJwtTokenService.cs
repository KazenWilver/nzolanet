using NzolaNet.Domain.Entities;

namespace NzolaNet.Application.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(User user);
}

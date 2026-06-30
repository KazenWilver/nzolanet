using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Entities;

namespace NzolaNet.Infrastructure.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _config;
    private readonly UserManager<User> _userManager;

    public JwtTokenService(IConfiguration config, UserManager<User> userManager)
    {
        _config = config;
        _userManager = userManager;
    }

    public async Task<string> GenerateTokenAsync(User user)
    {
        var jwtSettings = _config.GetSection("JwtSettings");
        var jwtKey = Environment.GetEnvironmentVariable("NZOLANET_JWT_KEY")
            ?? jwtSettings["Key"]
            ?? throw new InvalidOperationException("JWT key is not configured.");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.Contains("Admin") ? "Admin" : "User";

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.UserName ?? string.Empty),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim("role", role),
            new Claim(ClaimTypes.Role, role)
        };

        var durationInDays = jwtSettings.GetValue("DurationInDays", 7);
        var expires = DateTime.UtcNow.AddDays(durationInDays);

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public Guid? TryGetUserIdFromToken(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        try
        {
            var jwtSettings = _config.GetSection("JwtSettings");
            var jwtKey = Environment.GetEnvironmentVariable("NZOLANET_JWT_KEY")
                ?? jwtSettings["Key"]
                ?? throw new InvalidOperationException("JWT key is not configured.");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

            var handler = new JwtSecurityTokenHandler();
            var principal = handler.ValidateToken(
                token,
                new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = key,
                    ValidateIssuer = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidateAudience = true,
                    ValidAudience = jwtSettings["Audience"],
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1)
                },
                out _);

            var userIdClaim = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
        }
        catch
        {
            return null;
        }
    }
}

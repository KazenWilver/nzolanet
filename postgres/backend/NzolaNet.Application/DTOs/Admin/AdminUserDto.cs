namespace NzolaNet.Application.DTOs.Admin;

/// <summary>
/// A platform user as seen in the administrator user-management table.
/// </summary>
public class AdminUserDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? Email { get; set; }
    public string? ProfilePhotoUrl { get; set; }
    public bool IsPrivate { get; set; }
    public string Role { get; set; } = "User";
    public int FollowersCount { get; set; }
    public int FollowingCount { get; set; }
    public int PublicacoesCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsDeactivated { get; set; }
    public bool IsBanned { get; set; }
    public bool IsOnline { get; set; }
}

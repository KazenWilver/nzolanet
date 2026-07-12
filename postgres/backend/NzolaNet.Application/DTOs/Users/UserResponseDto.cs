namespace NzolaNet.Application.DTOs.Users;

public class UserResponseDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? Bio { get; set; }
    public string? ProfilePhotoUrl { get; set; }
    public string? CoverPhotoUrl { get; set; }
    public bool IsPrivate { get; set; }
    public int FollowersCount { get; set; }
    public int FollowingCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsFollowing { get; set; }
    public bool IsPending { get; set; }
    public bool HasIncomingFollowRequest { get; set; }
    public string? Role { get; set; }
}

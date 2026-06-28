namespace NzolaNet.Application.DTOs.Users;

public class UserResponseDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? Bio { get; set; }
    public string? ProfilePhotoUrl { get; set; }
    public bool IsPrivate { get; set; }
    public int FollowersCount { get; set; }
    public int FollowingCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

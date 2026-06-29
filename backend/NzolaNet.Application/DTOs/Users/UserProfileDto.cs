using System;

namespace NzolaNet.Application.DTOs.Users;

public class UserProfileDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? ProfilePhoto { get; set; }
    public string? CoverPhoto { get; set; }
    public bool IsPrivate { get; set; }
    public string? Bio { get; set; }
    public int FollowersCount { get; set; }
    public int FollowingCount { get; set; }
    public bool IsFollowing { get; set; }
    public bool IsPending { get; set; }
}

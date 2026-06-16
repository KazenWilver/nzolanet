using System;

namespace NzolaNet.Application.DTOs.Users;

public class FollowRequestDto
{
    public Guid FollowerId { get; set; }
    public string FollowerUsername { get; set; } = string.Empty;
    public string? FollowerProfilePhoto { get; set; }
    public DateTime RequestedAt { get; set; }
}

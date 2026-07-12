using System;

namespace NzolaNet.Domain.Entities;

public class Follow
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid FollowerId { get; set; }
    public virtual User Follower { get; set; } = null!;

    public Guid FollowedId { get; set; }
    public virtual User Followed { get; set; } = null!;

    public bool IsApproved { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

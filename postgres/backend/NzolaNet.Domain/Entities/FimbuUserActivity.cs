namespace NzolaNet.Domain.Entities;

/// <summary>
/// Tracks, per user, how much they interact with the Fimbu assistant. One
/// interaction is counted for every message the user sends to Fimbu. Used to
/// rank the most active users on the administrator dashboard.
/// </summary>
public class FimbuUserActivity
{
    public Guid UserId { get; set; }
    public long Interactions { get; set; }
    public DateTime LastInteractionUtc { get; set; } = DateTime.UtcNow;
}

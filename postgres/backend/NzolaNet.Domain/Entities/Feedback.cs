namespace NzolaNet.Domain.Entities;

/// <summary>
/// Stores user-submitted application feedback for administrators to review.
/// </summary>
public class Feedback
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

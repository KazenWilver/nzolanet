namespace NzolaNet.Application.DTOs.Feedback;

/// <summary>
/// Feedback entry returned to administrators.
/// </summary>
public class FeedbackDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? Email { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

namespace NzolaNet.Application.DTOs.Notifications;

public class NotificationResponseDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid ActorId { get; set; }
    public string ActorUsername { get; set; } = string.Empty;
    public string? ActorDisplayName { get; set; }
    public string? ActorPhotoUrl { get; set; }
    public Guid? PublicationId { get; set; }
    public string? PublicationText { get; set; }
    public Guid? CommentId { get; set; }
    public string? CommentText { get; set; }
    public Guid? ConversationId { get; set; }
    public string? MessageText { get; set; }
}

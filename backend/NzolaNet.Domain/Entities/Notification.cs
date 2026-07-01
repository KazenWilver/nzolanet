namespace NzolaNet.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RecipientId { get; set; }
    public virtual User Recipient { get; set; } = null!;
    public Guid ActorId { get; set; }
    public virtual User Actor { get; set; } = null!;
    public string Type { get; set; } = string.Empty;
    public Guid? PublicationId { get; set; }
    public virtual Post? Publication { get; set; }
    public Guid? CommentId { get; set; }
    public virtual Comment? Comment { get; set; }
    public Guid? ConversationId { get; set; }
    public Guid? MessageId { get; set; }
    public string? MessagePreview { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

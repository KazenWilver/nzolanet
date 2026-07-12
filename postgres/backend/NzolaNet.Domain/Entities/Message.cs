namespace NzolaNet.Domain.Entities;

/// <summary>
/// Mensagem de texto numa conversa.
/// </summary>
public class Message
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ConversationId { get; set; }
    public virtual Conversation Conversation { get; set; } = null!;
    public Guid SenderId { get; set; }
    public virtual User Sender { get; set; } = null!;
    public string Text { get; set; } = string.Empty;
    public string? ImagePath { get; set; }
    public string? VideoPath { get; set; }
    public string? AudioPath { get; set; }
    public string? DocumentPath { get; set; }
    public string? DocumentFileName { get; set; }
    public Guid? ReplyToMessageId { get; set; }
    public virtual Message? ReplyTo { get; set; }
    public Guid? ForwardedFromMessageId { get; set; }
    public string? RemoteImageUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EditedAt { get; set; }
    public bool IsDeleted { get; set; }
    public bool IsDeletedForEveryone { get; set; }
    public DateTime? DeletedForEveryoneAt { get; set; }
}

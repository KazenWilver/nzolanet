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
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; }
}

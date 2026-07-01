namespace NzolaNet.Domain.Entities;

/// <summary>
/// Participante numa conversa, com estado de leitura.
/// </summary>
public class ConversationParticipant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ConversationId { get; set; }
    public virtual Conversation Conversation { get; set; } = null!;
    public Guid UserId { get; set; }
    public virtual User User { get; set; } = null!;
    public DateTime? LastReadAt { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

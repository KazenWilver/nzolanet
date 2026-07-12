namespace NzolaNet.Domain.Entities;

/// <summary>
/// Mensagem oculta apenas para um utilizador (apagar para mim).
/// </summary>
public class MessageUserHide
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MessageId { get; set; }
    public virtual Message Message { get; set; } = null!;
    public Guid UserId { get; set; }
    public virtual User User { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

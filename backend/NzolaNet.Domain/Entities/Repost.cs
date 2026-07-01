namespace NzolaNet.Domain.Entities;

/// <summary>
/// Repartilha de uma publicação por um utilizador.
/// </summary>
public class Repost
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public virtual User User { get; set; } = null!;
    public Guid PostId { get; set; }
    public virtual Post Post { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

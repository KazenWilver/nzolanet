namespace NzolaNet.Domain.Interfaces.Repositories;

/// <summary>
/// Persists and queries per-user Fimbu interaction activity.
/// </summary>
public interface IFimbuActivityRepository
{
    /// <summary>
    /// Registers one more interaction for the given user, creating the record
    /// when it does not exist yet.
    /// </summary>
    Task RegisterInteractionAsync(Guid userId);

    /// <summary>
    /// Returns the most active users ranked by number of interactions.
    /// </summary>
    Task<IReadOnlyList<TopFimbuUserEntry>> GetTopInteractingUsersAsync(int limit);
}

public sealed class TopFimbuUserEntry
{
    public Guid UserId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string NomeUtilizador { get; set; } = string.Empty;
    public string? FotoPerfil { get; set; }
    public long TotalInteracoes { get; set; }
}

namespace NzolaNet.Application.DTOs.Admin;

/// <summary>
/// A profile together with its follower count, for the most-followed ranking.
/// </summary>
public class AdminTopFollowedDto
{
    public Guid Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string NomeUtilizador { get; set; } = string.Empty;
    public string? FotoPerfil { get; set; }
    public int TotalSeguidores { get; set; }
}

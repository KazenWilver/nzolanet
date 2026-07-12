namespace NzolaNet.Application.DTOs.Admin;

/// <summary>
/// A user together with how many times they interacted with the Fimbu
/// assistant, for the most-active-with-Fimbu ranking.
/// </summary>
public class AdminTopFimbuUserDto
{
    public Guid Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string NomeUtilizador { get; set; } = string.Empty;
    public string? FotoPerfil { get; set; }
    public long TotalInteracoes { get; set; }
}

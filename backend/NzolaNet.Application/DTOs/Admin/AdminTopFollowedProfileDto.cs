namespace NzolaNet.Application.DTOs.Admin;

public class AdminTopFollowedProfileDto
{
    public Guid UserId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string NomeUtilizador { get; set; } = string.Empty;
    public string? FotoPerfil { get; set; }
    public int TotalSeguidores { get; set; }
}

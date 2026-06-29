namespace NzolaNet.Application.DTOs.Admin;

public class AdminReportedCommentDto
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public Guid AutorId { get; set; }
    public string AutorNome { get; set; } = string.Empty;
    public string? AutorFoto { get; set; }
    public string AutorNomeUtilizador { get; set; } = string.Empty;
    public string Texto { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; }
    public DateTime? AtualizadoEm { get; set; }
    public int ReportsCount { get; set; }
}

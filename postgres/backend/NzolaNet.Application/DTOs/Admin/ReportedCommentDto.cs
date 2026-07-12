namespace NzolaNet.Application.DTOs.Admin;

/// <summary>
/// A reported comment together with the reports filed against it, shown in the
/// moderation queue of the administrator dashboard.
/// </summary>
public class ReportedCommentDto
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public Guid AutorId { get; set; }
    public string AutorNome { get; set; } = string.Empty;
    public string AutorNomeUtilizador { get; set; } = string.Empty;
    public string? AutorFoto { get; set; }
    public string Texto { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; }
    public DateTime? AtualizadoEm { get; set; }
    public int ReportsCount { get; set; }
    public IReadOnlyList<AdminReportEntryDto> Reports { get; set; } = new List<AdminReportEntryDto>();
}

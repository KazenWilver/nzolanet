namespace NzolaNet.Application.DTOs.Admin;

/// <summary>
/// A reported publication together with the reports filed against it, shown in
/// the moderation queue of the administrator dashboard.
/// </summary>
public class ReportedPublicationDto
{
    public Guid Id { get; set; }
    public Guid DonoId { get; set; }
    public string DonoNome { get; set; } = string.Empty;
    public string DonoNomeUtilizador { get; set; } = string.Empty;
    public string? DonoFoto { get; set; }
    public string Texto { get; set; } = string.Empty;
    public string? ImagemUrl { get; set; }
    public string? VideoUrl { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime? AtualizadoEm { get; set; }
    public int ReportsCount { get; set; }
    public IReadOnlyList<AdminReportEntryDto> Reports { get; set; } = new List<AdminReportEntryDto>();
}

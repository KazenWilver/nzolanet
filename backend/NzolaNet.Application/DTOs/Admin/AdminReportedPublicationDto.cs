namespace NzolaNet.Application.DTOs.Admin;

public class AdminReportedPublicationDto
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
    public IReadOnlyList<AdminReportEntryDto> Reports { get; set; } = Array.Empty<AdminReportEntryDto>();
}

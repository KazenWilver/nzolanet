namespace NzolaNet.Application.DTOs.Admin;

public class AdminReportEntryDto
{
    public Guid ReporterId { get; set; }
    public string ReporterNome { get; set; } = string.Empty;
    public string ReporterNomeUtilizador { get; set; } = string.Empty;
    public string Motivo { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public DateTime CriadoEm { get; set; }
}

using System.ComponentModel.DataAnnotations;

namespace NzolaNet.Application.DTOs.Reports;

public class ReportContentDto
{
    [Required]
    [MaxLength(80)]
    public string Reason { get; set; } = string.Empty;

    [MaxLength(600)]
    public string? Details { get; set; }
}

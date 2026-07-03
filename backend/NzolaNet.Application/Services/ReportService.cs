using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Application.Services;

public class ReportService : IReportService
{
    private readonly IContentReportRepository _contentReportRepository;
    private readonly IPostRepository _postRepository;
    private readonly ICommentRepository _commentRepository;

    public ReportService(
        IContentReportRepository contentReportRepository,
        IPostRepository postRepository,
        ICommentRepository commentRepository)
    {
        _contentReportRepository = contentReportRepository;
        _postRepository = postRepository;
        _commentRepository = commentRepository;
    }

    public Task ReportPostAsync(Guid reporterId, Guid postId, string reason, string? details = null)
    {
        return ReportAsync(reporterId, "post", postId, reason, details);
    }

    public Task ReportCommentAsync(Guid reporterId, Guid commentId, string reason, string? details = null)
    {
        return ReportAsync(reporterId, "comment", commentId, reason, details);
    }

    private async Task ReportAsync(
        Guid reporterId,
        string targetType,
        Guid targetId,
        string reason,
        string? details)
    {
        var normalizedReason = reason?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalizedReason))
        {
            throw new ArgumentException("O motivo da denúncia é obrigatório.");
        }

        var targetExists = targetType switch
        {
            "post" => await _postRepository.GetByIdAsync(targetId) != null,
            "comment" => await _commentRepository.GetByIdAsync(targetId) != null,
            _ => false
        };

        if (!targetExists)
        {
            throw new ArgumentException("Conteúdo não encontrado.");
        }

        var alreadyReported = await _contentReportRepository
            .ExistsByReporterAndTargetAsync(reporterId, targetType, targetId);
        if (alreadyReported)
        {
            throw new InvalidOperationException("Já denunciaste este conteúdo.");
        }

        var report = new ContentReport
        {
            ReporterId = reporterId,
            TargetType = targetType,
            TargetId = targetId,
            Reason = normalizedReason,
            Details = string.IsNullOrWhiteSpace(details) ? null : details.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        var created = await _contentReportRepository.CreateAsync(report);
        if (!created)
        {
            throw new InvalidOperationException("Não foi possível registar a denúncia.");
        }
    }
}

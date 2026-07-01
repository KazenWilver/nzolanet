namespace NzolaNet.Application.Interfaces;

public interface IReportService
{
    Task ReportPostAsync(Guid reporterId, Guid postId, string reason, string? details = null);
    Task ReportCommentAsync(Guid reporterId, Guid commentId, string reason, string? details = null);
}

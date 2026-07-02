using NzolaNet.Domain.Entities;

namespace NzolaNet.Domain.Interfaces.Repositories;

public interface IContentReportRepository
{
    Task<bool> ExistsByReporterAndTargetAsync(Guid reporterId, string targetType, Guid targetId);
    Task<bool> CreateAsync(ContentReport report);
    Task<int> GetTotalReportedCommentsAsync();
    Task<int> GetTotalReportedPostsAsync();
    Task<int> GetTotalReportsCountAsync();
    Task<IReadOnlyList<ContentReport>> GetByTargetTypeAsync(string targetType);
    Task<int> DeleteByTargetAsync(string targetType, Guid targetId);
}

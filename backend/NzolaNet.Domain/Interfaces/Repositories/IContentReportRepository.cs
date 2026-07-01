using NzolaNet.Domain.Entities;

namespace NzolaNet.Domain.Interfaces.Repositories;

public interface IContentReportRepository
{
    Task<bool> ExistsByReporterAndTargetAsync(Guid reporterId, string targetType, Guid targetId);
    Task<bool> CreateAsync(ContentReport report);
    Task<int> GetTotalReportedCommentsAsync();
}

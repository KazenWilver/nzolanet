using Microsoft.EntityFrameworkCore;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;
using NzolaNet.Infrastructure.Data;

namespace NzolaNet.Infrastructure.Repositories;

public class ContentReportRepository : IContentReportRepository
{
    private readonly ApplicationDbContext _context;

    public ContentReportRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<bool> ExistsByReporterAndTargetAsync(Guid reporterId, string targetType, Guid targetId)
    {
        return _context.ContentReports.AnyAsync(report =>
            report.ReporterId == reporterId &&
            report.TargetType == targetType &&
            report.TargetId == targetId);
    }

    public async Task<bool> CreateAsync(ContentReport report)
    {
        _context.ContentReports.Add(report);
        return await _context.SaveChangesAsync() > 0;
    }

    public Task<int> GetTotalReportedCommentsAsync()
    {
        return _context.ContentReports.CountAsync(report => report.TargetType == "comment");
    }
}

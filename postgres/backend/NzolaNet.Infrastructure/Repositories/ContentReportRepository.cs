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
        return _context.ContentReports
            .Where(report => report.TargetType == "comment")
            .Select(report => report.TargetId)
            .Distinct()
            .CountAsync();
    }

    public Task<int> GetTotalReportedPostsAsync()
    {
        return _context.ContentReports
            .Where(report => report.TargetType == "post")
            .Select(report => report.TargetId)
            .Distinct()
            .CountAsync();
    }

    public Task<int> GetTotalReportsCountAsync()
    {
        return _context.ContentReports.CountAsync();
    }

    public async Task<IReadOnlyList<ContentReport>> GetByTargetTypeAsync(string targetType)
    {
        return await _context.ContentReports
            .AsNoTracking()
            .Include(report => report.Reporter)
            .Where(report => report.TargetType == targetType)
            .OrderByDescending(report => report.CreatedAt)
            .ToListAsync();
    }

    public async Task<int> DeleteByTargetAsync(string targetType, Guid targetId)
    {
        var reports = await _context.ContentReports
            .Where(report => report.TargetType == targetType && report.TargetId == targetId)
            .ToListAsync();

        if (reports.Count == 0)
        {
            return 0;
        }

        _context.ContentReports.RemoveRange(reports);
        await _context.SaveChangesAsync();
        return reports.Count;
    }
}

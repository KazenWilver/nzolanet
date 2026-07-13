using Microsoft.EntityFrameworkCore;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;
using NzolaNet.Infrastructure.Data;

namespace NzolaNet.Infrastructure.Repositories;

/// <summary>
/// EF Core repository for <see cref="Feedback"/> entities.
/// </summary>
public class FeedbackRepository : IFeedbackRepository
{
    private readonly ApplicationDbContext _context;

    public FeedbackRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> CreateAsync(Feedback feedback)
    {
        _context.Feedbacks.Add(feedback);
        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<IReadOnlyList<Feedback>> GetAllAsync()
    {
        return await _context.Feedbacks
            .AsNoTracking()
            .Include(feedback => feedback.User)
            .OrderByDescending(feedback => feedback.CreatedAt)
            .ToListAsync();
    }
}

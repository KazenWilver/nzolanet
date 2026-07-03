using Microsoft.EntityFrameworkCore;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;
using NzolaNet.Infrastructure.Data;

namespace NzolaNet.Infrastructure.Repositories;

public class FimbuActivityRepository : IFimbuActivityRepository
{
    private readonly ApplicationDbContext _context;

    public FimbuActivityRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task RegisterInteractionAsync(Guid userId)
    {
        var activity = await _context.FimbuUserActivities.FirstOrDefaultAsync(a => a.UserId == userId);

        if (activity == null)
        {
            _context.FimbuUserActivities.Add(new FimbuUserActivity
            {
                UserId = userId,
                Interactions = 1,
                LastInteractionUtc = DateTime.UtcNow
            });
        }
        else
        {
            activity.Interactions += 1;
            activity.LastInteractionUtc = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    public async Task<IReadOnlyList<TopFimbuUserEntry>> GetTopInteractingUsersAsync(int limit)
    {
        return await _context.FimbuUserActivities
            .AsNoTracking()
            .OrderByDescending(activity => activity.Interactions)
            .ThenByDescending(activity => activity.LastInteractionUtc)
            .Take(limit)
            .Join(
                _context.Users,
                activity => activity.UserId,
                user => user.Id,
                (activity, user) => new TopFimbuUserEntry
                {
                    UserId = user.Id,
                    Nome = user.DisplayName ?? user.UserName ?? string.Empty,
                    NomeUtilizador = user.UserName ?? string.Empty,
                    FotoPerfil = user.ProfilePhoto,
                    TotalInteracoes = activity.Interactions
                })
            .ToListAsync();
    }
}

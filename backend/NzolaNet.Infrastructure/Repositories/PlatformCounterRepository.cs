using Microsoft.EntityFrameworkCore;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;
using NzolaNet.Infrastructure.Data;

namespace NzolaNet.Infrastructure.Repositories;

public class PlatformCounterRepository : IPlatformCounterRepository
{
    private readonly ApplicationDbContext _context;

    public PlatformCounterRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task IncrementAsync(string key, long by = 1)
    {
        var counter = await _context.PlatformCounters.FirstOrDefaultAsync(c => c.Key == key);

        if (counter == null)
        {
            _context.PlatformCounters.Add(new PlatformCounter { Key = key, Value = by });
        }
        else
        {
            counter.Value += by;
        }

        await _context.SaveChangesAsync();
    }

    public async Task<long> GetAsync(string key)
    {
        var counter = await _context.PlatformCounters
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Key == key);

        return counter?.Value ?? 0;
    }
}

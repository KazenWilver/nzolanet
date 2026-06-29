using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;
using NzolaNet.Infrastructure.Data;

namespace NzolaNet.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;

    public UserRepository(ApplicationDbContext context, UserManager<User> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        return await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        return await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.NormalizedUserName == username.ToUpper());
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.NormalizedEmail == email.ToUpper());
    }

    public async Task<bool> ExistsByEmailAsync(string email)
    {
        return await _context.Users.AnyAsync(u => u.NormalizedEmail == email.ToUpper());
    }

    public async Task<bool> ExistsByUsernameAsync(string username)
    {
        return await _context.Users.AnyAsync(u => u.NormalizedUserName == username.ToUpper());
    }

    public async Task<bool> CreateAsync(User user, string password)
    {
        var result = await _userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(e => e.Description));
            throw new ArgumentException($"Erro ao criar o utilizador: {errors}");
        }
        return true;
    }

    public async Task<bool> UpdateAsync(User user)
    {
        _context.Users.Update(user);
        var affectedRows = await _context.SaveChangesAsync();
        return affectedRows > 0;
    }

    public async Task AddToRoleAsync(User user, string role)
    {
        await _userManager.AddToRoleAsync(user, role);
    }

    public async Task<IReadOnlyList<string>> GetRolesAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return Array.Empty<string>();
        }

        var roles = await _userManager.GetRolesAsync(user);
        return roles.ToList();
    }

    public async Task<System.Collections.Generic.IEnumerable<User>> SearchAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return System.Linq.Enumerable.Empty<User>();
        }
        var upperQuery = query.ToUpper();
        return await _context.Users
            .Where(u =>
                (u.NormalizedUserName != null && u.NormalizedUserName.Contains(upperQuery)) ||
                (u.DisplayName != null && u.DisplayName.ToUpper().Contains(upperQuery)) ||
                (u.Bio != null && u.Bio.ToUpper().Contains(upperQuery)))
            .Take(20)
            .ToListAsync();
    }

    public async Task<System.Collections.Generic.IEnumerable<User>> GetSuggestionsAsync(Guid currentUserId, int count)
    {
        var excludedIds = await _context.Follows
            .Where(f => f.FollowerId == currentUserId)
            .Select(f => f.FollowedId)
            .ToListAsync();

        excludedIds.Add(currentUserId);

        return await _context.Users
            .Where(u => !excludedIds.Contains(u.Id))
            .OrderByDescending(u =>
                _context.Follows.Count(f => f.FollowedId == u.Id && f.IsApproved))
            .Take(count)
            .ToListAsync();
    }

    public Task<int> GetTotalCountAsync()
    {
        return _context.Users.CountAsync();
    }
}

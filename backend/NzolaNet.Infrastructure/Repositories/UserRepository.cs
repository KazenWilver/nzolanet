using System.Text.RegularExpressions;
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
        var tracked = await _context.Users.FindAsync(user.Id);
        if (tracked == null)
        {
            return false;
        }

        tracked.DisplayName = user.DisplayName;
        tracked.Bio = user.Bio;
        tracked.IsPrivate = user.IsPrivate;
        tracked.ProfilePhoto = user.ProfilePhoto;
        tracked.CoverPhoto = user.CoverPhoto;
        tracked.UpdatedAt = user.UpdatedAt;

        return await _context.SaveChangesAsync() > 0;
    }

    public async Task<bool> UpdateProfileFieldsAsync(
        Guid id,
        string? displayName = null,
        string? bio = null,
        bool? isPrivate = null,
        string? profilePhoto = null,
        string? coverPhoto = null)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return false;
        }

        if (displayName != null)
        {
            user.DisplayName = displayName;
        }

        if (bio != null)
        {
            user.Bio = bio;
        }

        if (isPrivate.HasValue)
        {
            user.IsPrivate = isPrivate.Value;
        }

        if (profilePhoto != null)
        {
            user.ProfilePhoto = profilePhoto;
        }

        if (coverPhoto != null)
        {
            user.CoverPhoto = coverPhoto;
        }

        user.UpdatedAt = DateTime.UtcNow;

        return await _context.SaveChangesAsync() > 0;
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

    public async Task<System.Collections.Generic.IEnumerable<User>> GetSuggestionsAsync(
        Guid currentUserId,
        int count,
        IEnumerable<Guid>? excludeExtraIds = null)
    {
        var excludedIds = await _context.Follows
            .Where(f => f.FollowerId == currentUserId && f.IsApproved)
            .Select(f => f.FollowedId)
            .ToListAsync();

        var pendingOutgoing = await _context.Follows
            .Where(f => f.FollowerId == currentUserId && !f.IsApproved)
            .Select(f => f.FollowedId)
            .ToListAsync();

        excludedIds.Add(currentUserId);
        excludedIds.AddRange(pendingOutgoing);

        if (excludeExtraIds != null)
        {
            excludedIds.AddRange(excludeExtraIds);
        }

        var poolSize = Math.Clamp(count * 8, 24, 80);

        var candidates = await _context.Users
            .Where(u => !excludedIds.Contains(u.Id))
            .Select(u => new
            {
                User = u,
                FollowerCount = _context.Follows.Count(f => f.FollowedId == u.Id && f.IsApproved)
            })
            .OrderByDescending(entry => entry.FollowerCount)
            .ThenBy(entry => entry.User.DisplayName)
            .Take(poolSize)
            .Select(entry => entry.User)
            .ToListAsync();

        return candidates
            .Where(u => !IsAutomatedTestUser(u))
            .Take(count)
            .ToList();
    }

    private static bool IsAutomatedTestUser(User user)
    {
        var username = user.UserName ?? string.Empty;
        var displayName = user.DisplayName ?? string.Empty;

        if (AutomatedTestUsernamePattern.IsMatch(username))
        {
            return true;
        }

        if (username.StartsWith("smokeuser", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (user.Email?.EndsWith("@test.local", StringComparison.OrdinalIgnoreCase) == true)
        {
            return true;
        }

        if (displayName.StartsWith("Alice ", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return displayName is "Alice Audit" or "Alice FixTest" or "Feed Alice" or "Smoke Test User"
            || displayName.StartsWith("Smoke Test", StringComparison.OrdinalIgnoreCase)
            || displayName.StartsWith("Feed Alice", StringComparison.OrdinalIgnoreCase)
            || displayName.StartsWith("Alice Fix", StringComparison.OrdinalIgnoreCase);
    }

    private static readonly Regex AutomatedTestUsernamePattern = new(
        @"^(audit|fix|feed)A?\d+$",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

    public Task<int> GetTotalCountAsync()
    {
        return _context.Users.CountAsync();
    }

    public async Task<User?> GetByProfilePhotoPathAsync(string profilePhotoPath)
    {
        return await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.ProfilePhoto == profilePhotoPath);
    }

    public async Task<User?> GetByCoverPhotoPathAsync(string coverPhotoPath)
    {
        return await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.CoverPhoto == coverPhotoPath);
    }
}

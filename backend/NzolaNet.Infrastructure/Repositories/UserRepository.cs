using System;
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
            .Include(u => u.Posts)
            .Include(u => u.Followers)
            .Include(u => u.Following)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        return await _context.Users
            .Include(u => u.Followers)
            .Include(u => u.Following)
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
        return result.Succeeded;
    }

    public async Task<bool> UpdateAsync(User user)
    {
        _context.Users.Update(user);
        var affectedRows = await _context.SaveChangesAsync();
        return affectedRows > 0;
    }
}

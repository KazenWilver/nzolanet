using System;
using System.Threading.Tasks;
using NzolaNet.Domain.Entities;

namespace NzolaNet.Domain.Interfaces.Repositories;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByEmailAsync(string email);
    Task<bool> ExistsByEmailAsync(string email);
    Task<bool> ExistsByUsernameAsync(string username);
    Task<bool> CreateAsync(User user, string password);
    Task<bool> UpdateAsync(User user);
}

using System;
using System.Threading.Tasks;
using NzolaNet.Domain.Entities;

namespace NzolaNet.Domain.Interfaces.Repositories;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id);
    Task<bool> ExistsAsync(Guid id);
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByEmailAsync(string email);
    Task<bool> ExistsByEmailAsync(string email);
    Task<bool> ExistsByUsernameAsync(string username);
    Task<bool> CreateAsync(User user, string password);
    Task<bool> UpdateAsync(User user);
    Task<bool> UpdateProfileFieldsAsync(
        Guid id,
        string? displayName = null,
        string? bio = null,
        bool? isPrivate = null,
        string? profilePhoto = null,
        string? coverPhoto = null);
    Task AddToRoleAsync(User user, string role);
    Task<IReadOnlyList<string>> GetRolesAsync(Guid userId);
    Task<bool> DeleteAccountAsync(Guid userId);
    Task<System.Collections.Generic.IEnumerable<User>> SearchAsync(string query);
    Task<System.Collections.Generic.IEnumerable<User>> GetSuggestionsAsync(
        Guid currentUserId,
        int count,
        IEnumerable<Guid>? excludeExtraIds = null);
    Task<int> GetTotalCountAsync();
    Task<User?> GetByProfilePhotoPathAsync(string profilePhotoPath);
    Task<User?> GetByCoverPhotoPathAsync(string coverPhotoPath);
}

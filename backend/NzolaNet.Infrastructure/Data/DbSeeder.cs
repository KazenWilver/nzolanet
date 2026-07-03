using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NzolaNet.Domain.Entities;

namespace NzolaNet.Infrastructure.Data;

/// <summary>
/// Seeds default Identity roles (Admin and User) and a default administrator
/// account so the administrator dashboard is usable on a fresh database.
/// </summary>
public static class DbSeeder
{
    private const string AdminRoleName = "Admin";
    private const string UserRoleName = "User";

    public static async Task SeedAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var userManager = services.GetRequiredService<UserManager<User>>();
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        var configuration = services.GetRequiredService<IConfiguration>();
        var logger = services.GetRequiredService<ILogger<ApplicationDbContext>>();

        if (!await roleManager.RoleExistsAsync(AdminRoleName))
        {
            await roleManager.CreateAsync(new IdentityRole<Guid>(AdminRoleName));
        }

        if (!await roleManager.RoleExistsAsync(UserRoleName))
        {
            await roleManager.CreateAsync(new IdentityRole<Guid>(UserRoleName));
        }

        await SeedDefaultAdminAsync(userManager, configuration, logger);
        await CleanupAutomatedTestUsersAsync(dbContext, userManager, logger);
    }

    private static async Task SeedDefaultAdminAsync(
        UserManager<User> userManager,
        IConfiguration configuration,
        ILogger logger)
    {
        var seedSection = configuration.GetSection("SeedAdmin");
        var email = seedSection["Email"];
        var password = seedSection["Password"];

        // Only seed when both an email and a password are configured. This keeps
        // production safe: no admin is created unless it is explicitly requested.
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return;
        }

        var existing = await userManager.FindByEmailAsync(email);
        if (existing != null)
        {
            if (!await userManager.IsInRoleAsync(existing, AdminRoleName))
            {
                await userManager.AddToRoleAsync(existing, AdminRoleName);
            }

            return;
        }

        var admin = new User
        {
            UserName = seedSection["Username"] ?? "admin",
            Email = email,
            EmailConfirmed = true,
            DisplayName = seedSection["DisplayName"] ?? "Administrador",
            CreatedAt = DateTime.UtcNow
        };

        var created = await userManager.CreateAsync(admin, password);
        if (!created.Succeeded)
        {
            logger.LogWarning(
                "Não foi possível criar o administrador inicial: {Errors}",
                string.Join(", ", created.Errors.Select(error => error.Description)));
            return;
        }

        await userManager.AddToRoleAsync(admin, AdminRoleName);
        logger.LogInformation("Administrador inicial criado: {Email}.", email);
    }

    private static async Task CleanupAutomatedTestUsersAsync(
        ApplicationDbContext dbContext,
        UserManager<User> userManager,
        ILogger logger)
    {
        var testUserPattern = new Regex(@"^(audit|fix|feed)A?\d+$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

        foreach (var user in userManager.Users.ToList())
        {
            var username = user.UserName ?? string.Empty;
            var isAutomatedTestUser =
                testUserPattern.IsMatch(username) ||
                username.StartsWith("smokeuser", StringComparison.OrdinalIgnoreCase) ||
                (user.Email?.EndsWith("@test.local", StringComparison.OrdinalIgnoreCase) ?? false) ||
                user.DisplayName is "Alice Audit" or "Alice FixTest" or "Feed Alice" or "Smoke Test User" ||
                (user.DisplayName?.StartsWith("Smoke Test", StringComparison.OrdinalIgnoreCase) ?? false) ||
                (user.DisplayName?.StartsWith("Feed Alice", StringComparison.OrdinalIgnoreCase) ?? false) ||
                (user.DisplayName?.StartsWith("Alice ", StringComparison.OrdinalIgnoreCase) ?? false) ||
                (user.DisplayName?.StartsWith("Alice Fix", StringComparison.OrdinalIgnoreCase) ?? false);

            if (!isAutomatedTestUser)
            {
                continue;
            }

            var userId = user.Id;
            var relatedNotifications = await dbContext.Notifications
                .Where(notification => notification.ActorId == userId || notification.RecipientId == userId)
                .ToListAsync();

            if (relatedNotifications.Count > 0)
            {
                dbContext.Notifications.RemoveRange(relatedNotifications);
                await dbContext.SaveChangesAsync();
            }

            var result = await userManager.DeleteAsync(user);
            if (result.Succeeded)
            {
                logger.LogInformation("Utilizador de teste automático removido: {Username}.", username);
            }
            else
            {
                logger.LogWarning(
                    "Não foi possível remover o utilizador de teste {Username}: {Errors}",
                    username,
                    string.Join(", ", result.Errors.Select(error => error.Description)));
            }
        }
    }
}

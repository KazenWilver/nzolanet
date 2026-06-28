using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NzolaNet.Domain.Entities;

namespace NzolaNet.Infrastructure.Data;

/// <summary>
/// Seeds default Identity roles and an optional admin user from configuration.
/// </summary>
public static class DbSeeder
{
    private const string AdminRoleName = "Admin";
    private const string UserRoleName = "User";

    public static async Task SeedAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var userManager = services.GetRequiredService<UserManager<User>>();
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

        var seedSection = configuration.GetSection("SeedAdmin");
        var adminEmail = seedSection["Email"];
        var adminUsername = seedSection["Username"];
        var adminPassword = seedSection["Password"];

        if (string.IsNullOrWhiteSpace(adminEmail) ||
            string.IsNullOrWhiteSpace(adminUsername) ||
            string.IsNullOrWhiteSpace(adminPassword))
        {
            return;
        }

        var existingAdmin = await userManager.FindByEmailAsync(adminEmail);
        if (existingAdmin != null)
        {
            if (!await userManager.IsInRoleAsync(existingAdmin, AdminRoleName))
            {
                await userManager.AddToRoleAsync(existingAdmin, AdminRoleName);
            }

            return;
        }

        var adminUser = new User
        {
            UserName = adminUsername,
            Email = adminEmail,
            DisplayName = "Administrador",
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await userManager.CreateAsync(adminUser, adminPassword);
        if (!result.Succeeded)
        {
            logger.LogWarning(
                "Não foi possível criar o utilizador admin de seed: {Errors}",
                string.Join(", ", result.Errors.Select(e => e.Description)));
            return;
        }

        await userManager.AddToRoleAsync(adminUser, AdminRoleName);
        logger.LogInformation("Utilizador admin de seed criado com sucesso.");
    }
}

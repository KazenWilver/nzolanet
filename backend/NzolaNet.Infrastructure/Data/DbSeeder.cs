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
        var automatedUsers = userManager.Users
            .ToList()
            .Where(user =>
            {
                var username = user.UserName ?? string.Empty;
                return
                    testUserPattern.IsMatch(username) ||
                    username.StartsWith("smokeuser", StringComparison.OrdinalIgnoreCase) ||
                    (user.Email?.EndsWith("@test.local", StringComparison.OrdinalIgnoreCase) ?? false) ||
                    user.DisplayName is "Alice Audit" or "Alice FixTest" or "Feed Alice" or "Smoke Test User" ||
                    (user.DisplayName?.StartsWith("Smoke Test", StringComparison.OrdinalIgnoreCase) ?? false) ||
                    (user.DisplayName?.StartsWith("Feed Alice", StringComparison.OrdinalIgnoreCase) ?? false) ||
                    (user.DisplayName?.StartsWith("Alice ", StringComparison.OrdinalIgnoreCase) ?? false) ||
                    (user.DisplayName?.StartsWith("Alice Fix", StringComparison.OrdinalIgnoreCase) ?? false);
            })
            .ToList();

        if (automatedUsers.Count == 0)
        {
            return;
        }

        var automatedUserIds = automatedUsers.Select(user => user.Id).ToHashSet();
        var automatedPostIds = await dbContext.Posts
            .Where(post => automatedUserIds.Contains(post.UserId))
            .Select(post => post.Id)
            .ToListAsync();

        var automatedCommentIds = await dbContext.Comments
            .Where(comment => automatedUserIds.Contains(comment.UserId) || automatedPostIds.Contains(comment.PostId))
            .Select(comment => comment.Id)
            .ToListAsync();

        var removableConversationIds = await dbContext.ConversationParticipants
            .GroupBy(participant => participant.ConversationId)
            .Where(group => group.Any(participant => automatedUserIds.Contains(participant.UserId))
                && group.All(participant => automatedUserIds.Contains(participant.UserId)))
            .Select(group => group.Key)
            .ToListAsync();

        var automatedMessageIds = await dbContext.Messages
            .Where(message => automatedUserIds.Contains(message.SenderId) || removableConversationIds.Contains(message.ConversationId))
            .Select(message => message.Id)
            .ToListAsync();

        var notificationsToRemove = await dbContext.Notifications
            .Where(notification =>
                automatedUserIds.Contains(notification.ActorId) ||
                automatedUserIds.Contains(notification.RecipientId) ||
                (notification.PublicationId.HasValue && automatedPostIds.Contains(notification.PublicationId.Value)) ||
                (notification.CommentId.HasValue && automatedCommentIds.Contains(notification.CommentId.Value)) ||
                (notification.ConversationId.HasValue && removableConversationIds.Contains(notification.ConversationId.Value)) ||
                (notification.MessageId.HasValue && automatedMessageIds.Contains(notification.MessageId.Value)))
            .ToListAsync();

        var reportsToRemove = await dbContext.ContentReports
            .Where(report =>
                automatedUserIds.Contains(report.ReporterId) ||
                automatedPostIds.Contains(report.TargetId) ||
                automatedCommentIds.Contains(report.TargetId) ||
                automatedMessageIds.Contains(report.TargetId))
            .ToListAsync();

        var messageReactionsToRemove = await dbContext.MessageReactions
            .Where(reaction =>
                automatedUserIds.Contains(reaction.UserId) ||
                automatedMessageIds.Contains(reaction.MessageId))
            .ToListAsync();

        var hiddenMessagesToRemove = await dbContext.MessageUserHides
            .Where(hidden =>
                automatedUserIds.Contains(hidden.UserId) ||
                automatedMessageIds.Contains(hidden.MessageId))
            .ToListAsync();

        var likesToRemove = await dbContext.Likes
            .Where(like =>
                automatedUserIds.Contains(like.UserId) ||
                automatedPostIds.Contains(like.PostId))
            .ToListAsync();

        var repostsToRemove = await dbContext.Reposts
            .Where(repost =>
                automatedUserIds.Contains(repost.UserId) ||
                automatedPostIds.Contains(repost.PostId))
            .ToListAsync();

        var bookmarksToRemove = await dbContext.Bookmarks
            .Where(bookmark =>
                automatedUserIds.Contains(bookmark.UserId) ||
                automatedPostIds.Contains(bookmark.PostId))
            .ToListAsync();

        var followsToRemove = await dbContext.Follows
            .Where(follow =>
                automatedUserIds.Contains(follow.FollowerId) ||
                automatedUserIds.Contains(follow.FollowedId))
            .ToListAsync();

        var participantsToRemove = await dbContext.ConversationParticipants
            .Where(participant =>
                automatedUserIds.Contains(participant.UserId) ||
                removableConversationIds.Contains(participant.ConversationId))
            .ToListAsync();

        var messagesToRemove = await dbContext.Messages
            .Where(message => automatedMessageIds.Contains(message.Id))
            .ToListAsync();

        var commentsToRemove = await dbContext.Comments
            .Where(comment =>
                automatedUserIds.Contains(comment.UserId) ||
                automatedPostIds.Contains(comment.PostId))
            .ToListAsync();

        var postsToRemove = await dbContext.Posts
            .Where(post => automatedPostIds.Contains(post.Id))
            .ToListAsync();

        var conversationsToRemove = await dbContext.Conversations
            .Where(conversation => removableConversationIds.Contains(conversation.Id))
            .ToListAsync();

        var fimbuActivitiesToRemove = await dbContext.FimbuUserActivities
            .Where(activity => automatedUserIds.Contains(activity.UserId))
            .ToListAsync();

        dbContext.Notifications.RemoveRange(notificationsToRemove);
        dbContext.ContentReports.RemoveRange(reportsToRemove);
        dbContext.MessageReactions.RemoveRange(messageReactionsToRemove);
        dbContext.MessageUserHides.RemoveRange(hiddenMessagesToRemove);
        dbContext.Messages.RemoveRange(messagesToRemove);
        dbContext.ConversationParticipants.RemoveRange(participantsToRemove);
        dbContext.Conversations.RemoveRange(conversationsToRemove);
        dbContext.Likes.RemoveRange(likesToRemove);
        dbContext.Reposts.RemoveRange(repostsToRemove);
        dbContext.Bookmarks.RemoveRange(bookmarksToRemove);
        dbContext.Follows.RemoveRange(followsToRemove);
        dbContext.Comments.RemoveRange(commentsToRemove);
        dbContext.Posts.RemoveRange(postsToRemove);
        dbContext.FimbuUserActivities.RemoveRange(fimbuActivitiesToRemove);

        await dbContext.SaveChangesAsync();

        foreach (var user in automatedUsers)
        {
            var result = await userManager.DeleteAsync(user);
            if (result.Succeeded)
            {
                logger.LogInformation("Utilizador de teste automático removido: {Username}.", user.UserName);
                continue;
            }

            logger.LogWarning(
                "Não foi possível remover o utilizador de teste {Username}: {Errors}",
                user.UserName,
                string.Join(", ", result.Errors.Select(error => error.Description)));
        }
    }
}

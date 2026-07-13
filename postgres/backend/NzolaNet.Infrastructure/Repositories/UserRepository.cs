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

    public Task<bool> ExistsAsync(Guid id)
    {
        return _context.Users.AsNoTracking().AnyAsync(u => u.Id == id);
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
        tracked.IsDeactivated = user.IsDeactivated;
        tracked.IsBanned = user.IsBanned;
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

    public async Task<bool> DeleteAccountAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return false;
        }

        var postIds = await _context.Posts
            .Where(post => post.UserId == userId)
            .Select(post => post.Id)
            .ToListAsync();

        var commentIds = await _context.Comments
            .Where(comment => comment.UserId == userId || postIds.Contains(comment.PostId))
            .Select(comment => comment.Id)
            .ToListAsync();

        var participantRows = await _context.ConversationParticipants
            .Where(participant => participant.UserId == userId)
            .ToListAsync();
        var conversationIds = participantRows.Select(row => row.ConversationId).Distinct().ToList();

        var messagesFromUser = await _context.Messages
            .Where(message => message.SenderId == userId)
            .ToListAsync();
        var messageIds = messagesFromUser.Select(message => message.Id).ToList();

        var repliesToDeleted = await _context.Messages
            .Where(message => message.ReplyToMessageId.HasValue && messageIds.Contains(message.ReplyToMessageId.Value))
            .ToListAsync();
        foreach (var reply in repliesToDeleted)
        {
            reply.ReplyToMessageId = null;
        }

        _context.Notifications.RemoveRange(await _context.Notifications
            .Where(notification =>
                notification.ActorId == userId ||
                notification.RecipientId == userId ||
                (notification.PublicationId.HasValue && postIds.Contains(notification.PublicationId.Value)) ||
                (notification.CommentId.HasValue && commentIds.Contains(notification.CommentId.Value)) ||
                (notification.MessageId.HasValue && messageIds.Contains(notification.MessageId.Value)))
            .ToListAsync());

        _context.ContentReports.RemoveRange(await _context.ContentReports
            .Where(report =>
                report.ReporterId == userId ||
                postIds.Contains(report.TargetId) ||
                commentIds.Contains(report.TargetId) ||
                messageIds.Contains(report.TargetId))
            .ToListAsync());

        _context.Feedbacks.RemoveRange(await _context.Feedbacks
            .Where(feedback => feedback.UserId == userId)
            .ToListAsync());

        _context.MessageReactions.RemoveRange(await _context.MessageReactions
            .Where(reaction => reaction.UserId == userId || messageIds.Contains(reaction.MessageId))
            .ToListAsync());

        _context.MessageUserHides.RemoveRange(await _context.MessageUserHides
            .Where(hidden => hidden.UserId == userId || messageIds.Contains(hidden.MessageId))
            .ToListAsync());

        _context.Messages.RemoveRange(messagesFromUser);
        _context.ConversationParticipants.RemoveRange(participantRows);
        await _context.SaveChangesAsync();

        var orphanConversations = await _context.Conversations
            .Where(conversation => conversationIds.Contains(conversation.Id)
                && !_context.ConversationParticipants.Any(participant => participant.ConversationId == conversation.Id))
            .ToListAsync();
        _context.Conversations.RemoveRange(orphanConversations);

        _context.Likes.RemoveRange(await _context.Likes
            .Where(like => like.UserId == userId || postIds.Contains(like.PostId))
            .ToListAsync());
        _context.Reposts.RemoveRange(await _context.Reposts
            .Where(repost => repost.UserId == userId || postIds.Contains(repost.PostId))
            .ToListAsync());
        _context.Bookmarks.RemoveRange(await _context.Bookmarks
            .Where(bookmark => bookmark.UserId == userId || postIds.Contains(bookmark.PostId))
            .ToListAsync());
        _context.Follows.RemoveRange(await _context.Follows
            .Where(follow => follow.FollowerId == userId || follow.FollowedId == userId)
            .ToListAsync());
        _context.Comments.RemoveRange(await _context.Comments
            .Where(comment => commentIds.Contains(comment.Id))
            .ToListAsync());

        // Clear quoted-post references pointing at posts about to be deleted
        var postsToDelete = await _context.Posts
            .Where(post => postIds.Contains(post.Id))
            .ToListAsync();
        var quotingPosts = await _context.Posts
            .Where(post => post.QuotedPostId.HasValue && postIds.Contains(post.QuotedPostId.Value))
            .ToListAsync();
        foreach (var quotingPost in quotingPosts)
        {
            quotingPost.QuotedPostId = null;
        }

        _context.Posts.RemoveRange(postsToDelete);
        _context.FimbuUserActivities.RemoveRange(await _context.FimbuUserActivities
            .Where(activity => activity.UserId == userId)
            .ToListAsync());

        await _context.SaveChangesAsync();

        var deleteResult = await _userManager.DeleteAsync(user);
        return deleteResult.Succeeded;
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

using NzolaNet.Application.DTOs.Admin;
using NzolaNet.Application.DTOs.Auth;

namespace NzolaNet.Application.Interfaces;

/// <summary>
/// Coordinates administrator authentication and platform moderation tasks.
/// </summary>
public interface IAdminService
{
    /// <summary>
    /// Authenticates an administrator. Fails if the credentials are invalid or
    /// the account does not hold the administrator role.
    /// </summary>
    Task<AuthResponseDto> LoginAsync(AdminLoginDto loginDto);

    /// <summary>
    /// Registers a new administrator account. Requires a valid invite code.
    /// </summary>
    Task<AuthResponseDto> RegisterAsync(AdminRegisterDto registerDto);

    /// <summary>
    /// Gets the aggregated indicators shown on the dashboard.
    /// </summary>
    Task<AdminMetricsDto> GetMetricsAsync();

    /// <summary>
    /// Lists the comments that have been reported by users.
    /// </summary>
    Task<IReadOnlyList<ReportedCommentDto>> GetReportedCommentsAsync();

    /// <summary>
    /// Lists the publications that have been reported by users.
    /// </summary>
    Task<IReadOnlyList<ReportedPublicationDto>> GetReportedPublicationsAsync();

    /// <summary>
    /// Removes a comment and the reports filed against it.
    /// </summary>
    Task RemoveCommentAsync(Guid commentId);

    /// <summary>
    /// Dismisses the reports of a comment without removing the comment.
    /// </summary>
    Task DismissCommentReportsAsync(Guid commentId);

    /// <summary>
    /// Removes a publication and the reports filed against it.
    /// </summary>
    Task RemovePublicationAsync(Guid postId);

    /// <summary>
    /// Dismisses the reports of a publication without removing the publication.
    /// </summary>
    Task DismissPublicationReportsAsync(Guid postId);

    /// <summary>
    /// Lists every user registered on the platform.
    /// </summary>
    Task<IReadOnlyList<AdminUserDto>> GetUsersAsync();
}

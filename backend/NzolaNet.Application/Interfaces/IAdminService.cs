using NzolaNet.Application.DTOs.Admin;
using NzolaNet.Application.DTOs.Auth;

namespace NzolaNet.Application.Interfaces;

public interface IAdminService
{
    Task<AuthResponseDto> LoginAsync(AdminLoginDto loginDto);
    Task<AdminMetricsDto> GetMetricsAsync();
    Task<IEnumerable<AdminReportedCommentDto>> GetReportedCommentsAsync();
    Task DeleteCommentAsync(Guid adminUserId, Guid commentId);
}

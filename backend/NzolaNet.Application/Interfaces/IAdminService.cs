using NzolaNet.Application.DTOs.Admin;
using NzolaNet.Application.DTOs.Auth;

namespace NzolaNet.Application.Interfaces;

public interface IAdminService
{
    Task<AuthResponseDto> LoginAsync(AdminLoginDto loginDto);
    Task<AuthResponseDto> RegisterAdminAsync(AdminRegisterDto registerDto);
    Task<AdminMetricsDto> GetMetricsAsync(string periodoRanking = "30d");
    Task<IEnumerable<AdminReportedCommentDto>> GetReportedCommentsAsync();
    Task<IEnumerable<AdminReportedPublicationDto>> GetReportedPublicationsAsync();
    Task DeleteCommentAsync(Guid adminUserId, Guid commentId);
    Task DeletePublicationAsync(Guid adminUserId, Guid publicationId);
    Task DismissPublicationReportsAsync(Guid adminUserId, Guid publicationId);
}

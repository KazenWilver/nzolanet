using NzolaNet.Application.DTOs.Publications;

namespace NzolaNet.Application.Interfaces;

public interface IBookmarkService
{
    Task ToggleBookmarkAsync(Guid userId, Guid postId, bool bookmark);
    Task<PaginatedPublicationsResponseDto> GetMyBookmarksAsync(Guid userId, int page, int pageSize);
}

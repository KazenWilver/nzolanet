using NzolaNet.Application.DTOs.Publications;

namespace NzolaNet.Application.Interfaces;

public interface IPostService
{
    Task<PublicationResponseDto> CreateAsync(Guid userId, CreatePublicationDto createDto);
    Task<PublicationResponseDto> UpdateAsync(Guid userId, Guid postId, UpdatePublicationDto updateDto);
    Task DeleteAsync(Guid userId, Guid postId);
    Task<IEnumerable<PublicationResponseDto>> GetAllAsync(Guid? currentUserId = null);
    Task<PaginatedPublicationsResponseDto> GetAllPagedAsync(Guid? currentUserId, int page, int pageSize);
    Task<IEnumerable<PublicationResponseDto>> GetFeedAsync(Guid userId);
    Task<IEnumerable<PublicationResponseDto>> GetFollowingFeedAsync(Guid userId);
    Task<PaginatedPublicationsResponseDto> GetFollowingFeedPagedAsync(Guid userId, int page, int pageSize);
    Task<IEnumerable<PublicationResponseDto>> GetByUserIdAsync(Guid targetUserId, Guid? currentUserId = null);
    Task<PaginatedPublicationsResponseDto> GetByUserIdPagedAsync(
        Guid targetUserId,
        Guid? currentUserId,
        int page,
        int pageSize,
        bool mediaOnly = false);
    Task<IEnumerable<PublicationResponseDto>> GetLikedByUserIdAsync(Guid targetUserId, Guid? currentUserId = null);
    Task<PublicationResponseDto?> GetByIdAsync(Guid id, Guid? currentUserId = null);
    Task<PaginatedPublicationsResponseDto> GetByHashtagAsync(string tag, Guid? currentUserId, int page, int pageSize);
    Task<IReadOnlyList<string>> GetTrendingHashtagsAsync(int limit = 5);
}

using NzolaNet.Application.DTOs.Publications;

namespace NzolaNet.Application.Interfaces;

public interface IPostService
{
    Task<PublicationResponseDto> CreateAsync(Guid userId, CreatePublicationDto createDto);
    Task<PublicationResponseDto> UpdateAsync(Guid userId, Guid postId, UpdatePublicationDto updateDto);
    Task DeleteAsync(Guid userId, Guid postId);
    Task<IEnumerable<PublicationResponseDto>> GetAllAsync(Guid? currentUserId = null);
    Task<IEnumerable<PublicationResponseDto>> GetFeedAsync(Guid userId);
    Task<IEnumerable<PublicationResponseDto>> GetByUserIdAsync(Guid targetUserId, Guid? currentUserId = null);
    Task<PublicationResponseDto?> GetByIdAsync(Guid id, Guid? currentUserId = null);
}

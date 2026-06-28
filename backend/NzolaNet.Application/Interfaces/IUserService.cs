using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using NzolaNet.Application.DTOs.Users;

namespace NzolaNet.Application.Interfaces;

public interface IUserService
{
    Task<UserResponseDto> GetUserResponseAsync(Guid userId, Guid? currentUserId = null);
    Task<UserProfileDto> GetProfileAsync(Guid userId, Guid? currentUserId = null);
    Task<UserResponseDto> UpdateProfileAsync(Guid userId, UpdateProfileDto updateDto);
    Task<UserResponseDto> UploadPhotoAsync(Guid userId, IFormFile photoFile);
    Task FollowUserAsync(Guid followerId, Guid followedId);
    Task UnfollowUserAsync(Guid followerId, Guid followedId);
    Task<IEnumerable<FollowRequestDto>> GetPendingRequestsAsync(Guid userId);
    Task<bool> ApproveFollowRequestAsync(Guid followedId, Guid followerId);
    Task<bool> RejectFollowRequestAsync(Guid followedId, Guid followerId);
    Task<IEnumerable<UserResponseDto>> GetFollowersAsync(Guid userId, Guid? currentUserId = null);
    Task<IEnumerable<UserResponseDto>> GetFollowingAsync(Guid userId, Guid? currentUserId = null);
    Task<IEnumerable<UserResponseDto>> SearchUsersAsync(string query, Guid? currentUserId = null);
}

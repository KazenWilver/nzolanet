using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using NzolaNet.Application.DTOs.Users;

namespace NzolaNet.Application.Interfaces;

public interface IUserService
{
    Task<UserProfileDto> GetProfileAsync(Guid userId, Guid? currentUserId = null);
    Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileDto updateDto);
    Task<string> UploadPhotoAsync(Guid userId, IFormFile photoFile);
    Task<FollowResultDto> FollowUserAsync(Guid followerId, Guid followedId);
    Task<bool> UnfollowUserAsync(Guid followerId, Guid followedId);
    Task<IEnumerable<FollowRequestDto>> GetPendingRequestsAsync(Guid userId);
    Task<bool> ApproveFollowRequestAsync(Guid followedId, Guid followerId);
    Task<bool> RejectFollowRequestAsync(Guid followedId, Guid followerId);
    Task<IEnumerable<UserProfileDto>> GetFollowersAsync(Guid userId, Guid? currentUserId = null);
    Task<IEnumerable<UserProfileDto>> GetFollowingAsync(Guid userId, Guid? currentUserId = null);
}

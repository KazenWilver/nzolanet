using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using NzolaNet.Application.DTOs.Users;

namespace NzolaNet.Application.Interfaces;

public interface IUserService
{
    Task<UserProfileDto> GetProfileAsync(Guid userId);
    Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileDto updateDto);
    Task<string> UploadPhotoAsync(Guid userId, IFormFile photoFile);
    Task<bool> FollowUserAsync(Guid followerId, Guid followedId);
    Task<bool> UnfollowUserAsync(Guid followerId, Guid followedId);
}

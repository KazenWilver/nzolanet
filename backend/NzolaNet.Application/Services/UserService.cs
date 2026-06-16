using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using NzolaNet.Application.DTOs.Users;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;

namespace NzolaNet.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IStorageService _storageService;
    private readonly IFollowRepository _followRepository;

    public UserService(
        IUserRepository userRepository, 
        IStorageService storageService, 
        IFollowRepository followRepository)
    {
        _userRepository = userRepository;
        _storageService = storageService;
        _followRepository = followRepository;
    }

    public async Task<UserProfileDto> GetProfileAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("Utilizador não encontrado.");
        }

        var followersCount = await _followRepository.GetFollowersCountAsync(userId);
        var followingCount = await _followRepository.GetFollowingCountAsync(userId);

        return new UserProfileDto
        {
            Id = user.Id,
            Username = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            ProfilePhoto = user.ProfilePhoto,
            IsPrivate = user.IsPrivate,
            Bio = user.Bio,
            FollowersCount = followersCount,
            FollowingCount = followingCount
        };
    }

    public async Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileDto updateDto)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("Utilizador não encontrado.");
        }

        if (updateDto.Bio != null) user.Bio = updateDto.Bio;
        if (updateDto.IsPrivate.HasValue) user.IsPrivate = updateDto.IsPrivate.Value;
        user.UpdatedAt = DateTime.UtcNow;

        var updated = await _userRepository.UpdateAsync(user);
        if (!updated)
        {
            throw new ArgumentException("Não foi possível atualizar o perfil.");
        }

        return await GetProfileAsync(userId);
    }

    public async Task<string> UploadPhotoAsync(Guid userId, IFormFile photoFile)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("Utilizador não encontrado.");
        }

        if (!string.IsNullOrEmpty(user.ProfilePhoto))
        {
            _storageService.DeleteFile(user.ProfilePhoto);
        }

        var photoPath = await _storageService.SaveFileAsync(photoFile, "uploads/profiles");
        
        user.ProfilePhoto = photoPath;
        user.UpdatedAt = DateTime.UtcNow;
        
        await _userRepository.UpdateAsync(user);

        return photoPath;
    }

    public async Task<bool> FollowUserAsync(Guid followerId, Guid followedId)
    {
        if (followerId == followedId)
        {
            throw new ArgumentException("Não podes seguir-te a ti próprio.");
        }

        var follower = await _userRepository.GetByIdAsync(followerId);
        var followed = await _userRepository.GetByIdAsync(followedId);

        if (follower == null || followed == null)
        {
            throw new ArgumentException("Utilizador não encontrado.");
        }

        var alreadyFollowing = await _followRepository.IsFollowingAsync(followerId, followedId);
        if (alreadyFollowing)
        {
            return true;
        }

        var follow = new Follow
        {
            FollowerId = followerId,
            FollowedId = followedId,
            CreatedAt = DateTime.UtcNow
        };

        return await _followRepository.AddFollowAsync(follow);
    }

    public async Task<bool> UnfollowUserAsync(Guid followerId, Guid followedId)
    {
        var follower = await _userRepository.GetByIdAsync(followerId);
        var followed = await _userRepository.GetByIdAsync(followedId);

        if (follower == null || followed == null)
        {
            throw new ArgumentException("Utilizador não encontrado.");
        }

        return await _followRepository.RemoveFollowAsync(followerId, followedId);
    }
}

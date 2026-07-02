using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using NzolaNet.Application.DTOs.Users;
using NzolaNet.Application.Exceptions;
using NzolaNet.Application.Helpers;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;

namespace NzolaNet.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IStorageService _storageService;
    private readonly IFollowRepository _followRepository;
    private readonly INotificationService _notificationService;
    private readonly IEmailService _emailService;
    private readonly IAdminRealtimeNotifier _adminRealtimeNotifier;

    public UserService(
        IUserRepository userRepository, 
        IStorageService storageService, 
        IFollowRepository followRepository,
        INotificationService notificationService,
        IEmailService emailService,
        IAdminRealtimeNotifier adminRealtimeNotifier)
    {
        _userRepository = userRepository;
        _storageService = storageService;
        _followRepository = followRepository;
        _notificationService = notificationService;
        _emailService = emailService;
        _adminRealtimeNotifier = adminRealtimeNotifier;
    }

    public async Task<UserResponseDto> GetUserResponseAsync(Guid userId, Guid? currentUserId = null)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("Utilizador não encontrado.");
        }

        var followersCount = await _followRepository.GetFollowersCountAsync(userId);
        var followingCount = await _followRepository.GetFollowingCountAsync(userId);

        var response = new UserResponseDto
        {
            Id = user.Id,
            Username = user.UserName ?? string.Empty,
            DisplayName = user.DisplayName,
            Bio = user.Bio,
            ProfilePhotoUrl = user.ProfilePhoto,
            CoverPhotoUrl = user.CoverPhoto,
            IsPrivate = user.IsPrivate,
            FollowersCount = followersCount,
            FollowingCount = followingCount,
            CreatedAt = user.CreatedAt
        };

        if (currentUserId.HasValue)
        {
            if (currentUserId.Value == userId)
            {
                response.IsFollowing = true;
                response.IsPending = false;
                var roles = await _userRepository.GetRolesAsync(userId);
                response.Role = roles.Contains("Admin") ? "Admin" : "User";
            }
            else
            {
                response.IsFollowing = await _followRepository.IsFollowingAsync(currentUserId.Value, userId);
                response.IsPending = !response.IsFollowing &&
                    await _followRepository.IsFollowPendingAsync(currentUserId.Value, userId);
                response.HasIncomingFollowRequest =
                    await _followRepository.HasIncomingFollowRequestAsync(currentUserId.Value, userId);
            }
        }

        return response;
    }

    public async Task<UserProfileDto> GetProfileAsync(Guid userId, Guid? currentUserId = null)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("Utilizador não encontrado.");
        }

        var followersCount = await _followRepository.GetFollowersCountAsync(userId);
        var followingCount = await _followRepository.GetFollowingCountAsync(userId);

        var profileDto = new UserProfileDto
        {
            Id = user.Id,
            Username = user.UserName ?? string.Empty,
            DisplayName = user.DisplayName,
            Email = user.Email ?? string.Empty,
            ProfilePhoto = user.ProfilePhoto,
            CoverPhoto = user.CoverPhoto,
            IsPrivate = user.IsPrivate,
            Bio = user.Bio,
            FollowersCount = followersCount,
            FollowingCount = followingCount
        };

        if (currentUserId.HasValue)
        {
            if (currentUserId.Value == userId)
            {
                profileDto.IsFollowing = true;
                profileDto.IsPending = false;
            }
            else
            {
                profileDto.IsFollowing = await _followRepository.IsFollowingAsync(currentUserId.Value, userId);
                profileDto.IsPending = !profileDto.IsFollowing && await _followRepository.IsFollowPendingAsync(currentUserId.Value, userId);
            }
        }

        return profileDto;
    }

    public async Task<UserResponseDto> UpdateProfileAsync(Guid userId, UpdateProfileDto updateDto)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("Utilizador não encontrado.");
        }

        if (updateDto.DisplayName != null) user.DisplayName = updateDto.DisplayName;
        if (updateDto.Bio != null) user.Bio = updateDto.Bio;
        if (updateDto.IsPrivate.HasValue) user.IsPrivate = updateDto.IsPrivate.Value;

        ContentLimits.ValidateDisplayName(user.DisplayName);
        ContentLimits.ValidateBio(user.Bio);

        user.UpdatedAt = DateTime.UtcNow;

        var updated = await _userRepository.UpdateProfileFieldsAsync(
            userId,
            displayName: updateDto.DisplayName,
            bio: updateDto.Bio,
            isPrivate: updateDto.IsPrivate);
        if (!updated)
        {
            throw new ArgumentException("Não foi possível atualizar o perfil.");
        }

        return await GetUserResponseAsync(userId);
    }

    public async Task<UserResponseDto> UploadPhotoAsync(Guid userId, IFormFile photoFile)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("Utilizador não encontrado.");
        }

        FileHelper.ValidateImageFile(photoFile);

        if (!string.IsNullOrEmpty(user.ProfilePhoto))
        {
            _storageService.DeleteFile(user.ProfilePhoto);
        }

        var extension = Path.GetExtension(photoFile.FileName);
        var fileName = $"{userId}_{DateTime.UtcNow:yyyyMMddHHmmss}{extension}";
        var photoPath = await _storageService.SaveFileAsync(photoFile, "uploads/profiles", fileName);

        user.ProfilePhoto = photoPath;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateProfileFieldsAsync(userId, profilePhoto: photoPath);

        return await GetUserResponseAsync(userId);
    }

    public async Task<UserResponseDto> UploadCoverPhotoAsync(Guid userId, IFormFile photoFile)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("Utilizador não encontrado.");
        }

        FileHelper.ValidateImageFile(photoFile);

        if (!string.IsNullOrEmpty(user.CoverPhoto))
        {
            _storageService.DeleteFile(user.CoverPhoto);
        }

        var extension = Path.GetExtension(photoFile.FileName);
        var fileName = $"{userId}_cover_{DateTime.UtcNow:yyyyMMddHHmmss}{extension}";
        var photoPath = await _storageService.SaveFileAsync(photoFile, "uploads/covers", fileName);

        await _userRepository.UpdateProfileFieldsAsync(userId, coverPhoto: photoPath);

        return await GetUserResponseAsync(userId);
    }

    public async Task FollowUserAsync(Guid followerId, Guid followedId)
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
            throw new ConflictException("Já segues este utilizador.");
        }

        var alreadyPending = await _followRepository.IsFollowPendingAsync(followerId, followedId);
        if (alreadyPending)
        {
            throw new ConflictException("Pedido de seguimento já se encontra pendente.");
        }

        var follow = new Follow
        {
            FollowerId = followerId,
            FollowedId = followedId,
            IsApproved = !followed.IsPrivate,
            CreatedAt = DateTime.UtcNow
        };

        var success = await _followRepository.AddFollowAsync(follow);
        if (!success)
        {
            throw new ArgumentException("Não foi possível seguir o utilizador.");
        }

        if (follow.IsApproved)
        {
            await _notificationService.TryCreateFollowNotificationAsync(followerId, followedId);
        }
        else
        {
            await _notificationService.TryCreateFollowRequestNotificationAsync(followerId, followedId);
        }

        var hasIncomingFromTarget = await _followRepository.HasIncomingFollowRequestAsync(followerId, followedId);
        if (hasIncomingFromTarget)
        {
            await ApproveFollowRequestAsync(followerId, followedId);
            return;
        }

        if (follow.IsApproved)
        {
            await _adminRealtimeNotifier.NotifyMetricsChangedAsync();
        }
    }

    public async Task UnfollowUserAsync(Guid followerId, Guid followedId)
    {
        var follower = await _userRepository.GetByIdAsync(followerId);
        var followed = await _userRepository.GetByIdAsync(followedId);

        if (follower == null || followed == null)
        {
            throw new ArgumentException("Utilizador não encontrado.");
        }

        var isFollowing = await _followRepository.IsFollowingAsync(followerId, followedId);
        var isPending = await _followRepository.IsFollowPendingAsync(followerId, followedId);
        if (!isFollowing && !isPending)
        {
            throw new ArgumentException("Não segues este utilizador.");
        }

        var removed = await _followRepository.RemoveFollowAsync(followerId, followedId);
        if (!removed)
        {
            throw new ArgumentException("Não foi possível deixar de seguir o utilizador.");
        }

        await _adminRealtimeNotifier.NotifyMetricsChangedAsync();
    }

    public async Task<IEnumerable<FollowRequestDto>> GetPendingRequestsAsync(Guid userId)
    {
        var requests = await _followRepository.GetPendingFollowRequestsAsync(userId);
        return requests.Select(r => new FollowRequestDto
        {
            FollowerId = r.FollowerId,
            FollowerUsername = r.Follower?.UserName ?? string.Empty,
            FollowerProfilePhoto = r.Follower?.ProfilePhoto,
            RequestedAt = r.CreatedAt
        });
    }

    public async Task<bool> ApproveFollowRequestAsync(Guid followedId, Guid followerId)
    {
        var follow = await _followRepository.GetFollowRequestAsync(followerId, followedId);
        if (follow == null || follow.IsApproved)
        {
            return false;
        }

        follow.IsApproved = true;
        var updated = await _followRepository.UpdateFollowAsync(follow);
        if (updated)
        {
            await _notificationService.CleanupFollowRequestNotificationsAsync(followedId, followerId);
            await _notificationService.TryCreateFollowNotificationAsync(followerId, followedId);
            await _notificationService.TryCreateFollowAcceptedNotificationAsync(followedId, followerId);
            await _adminRealtimeNotifier.NotifyMetricsChangedAsync();
        }

        return updated;
    }

    public async Task<bool> RejectFollowRequestAsync(Guid followedId, Guid followerId)
    {
        var follow = await _followRepository.GetFollowRequestAsync(followerId, followedId);
        if (follow == null || follow.IsApproved)
        {
            return false;
        }

        var removed = await _followRepository.RemoveFollowAsync(followerId, followedId);
        if (!removed)
        {
            return false;
        }

        await _notificationService.CleanupFollowRequestNotificationsAsync(followedId, followerId);
        var followed = await _userRepository.GetByIdAsync(followedId);
        var follower = await _userRepository.GetByIdAsync(followerId);

        if (followed != null && follower != null)
        {
            var rejectorName = followed.DisplayName ?? followed.UserName ?? "Utilizador";
            if (!string.IsNullOrWhiteSpace(follower.Email))
            {
                await _emailService.SendFollowRequestRejectedEmailAsync(follower.Email, rejectorName);
            }

            await _notificationService.TryCreateFollowRejectedNotificationAsync(followedId, followerId);
        }

        return true;
    }

    public async Task<IEnumerable<UserResponseDto>> GetFollowersAsync(Guid userId, Guid? currentUserId = null)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("Utilizador não encontrado.");
        }

        if (user.IsPrivate && userId != currentUserId)
        {
            if (!currentUserId.HasValue)
            {
                throw new UnauthorizedAccessException("Este perfil é privado.");
            }

            var isFollowing = await _followRepository.IsFollowingAsync(currentUserId.Value, userId);
            if (!isFollowing)
            {
                throw new UnauthorizedAccessException("Este perfil é privado.");
            }
        }

        var followerIds = await _followRepository.GetFollowerIdsAsync(userId);

        var dtos = new List<UserResponseDto>();
        foreach (var followerId in followerIds)
        {
            dtos.Add(await GetUserResponseAsync(followerId, currentUserId));
        }

        return dtos;
    }

    public async Task<IEnumerable<UserResponseDto>> GetFollowingAsync(Guid userId, Guid? currentUserId = null)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new ArgumentException("Utilizador não encontrado.");
        }

        if (user.IsPrivate && userId != currentUserId)
        {
            if (!currentUserId.HasValue)
            {
                throw new UnauthorizedAccessException("Este perfil é privado.");
            }

            var isFollowing = await _followRepository.IsFollowingAsync(currentUserId.Value, userId);
            if (!isFollowing)
            {
                throw new UnauthorizedAccessException("Este perfil é privado.");
            }
        }

        var followedIds = await _followRepository.GetFollowingIdsAsync(userId);

        var dtos = new List<UserResponseDto>();
        foreach (var followedId in followedIds)
        {
            dtos.Add(await GetUserResponseAsync(followedId, currentUserId));
        }

        return dtos;
    }

    public async Task<IEnumerable<UserResponseDto>> SearchUsersAsync(string query, Guid? currentUserId = null)
    {
        var users = await _userRepository.SearchAsync(query);
        var dtos = new List<UserResponseDto>();
        foreach (var user in users)
        {
            dtos.Add(await GetUserResponseAsync(user.Id, currentUserId));
        }
        return dtos;
    }

    public async Task<UserResponseDto?> GetByUsernameAsync(string username, Guid? currentUserId = null)
    {
        var user = await _userRepository.GetByUsernameAsync(username);
        if (user == null)
        {
            return null;
        }

        return await GetUserResponseAsync(user.Id, currentUserId);
    }

    public async Task<IEnumerable<UserResponseDto>> GetSuggestionsAsync(
        Guid currentUserId,
        int count = 3,
        IEnumerable<Guid>? excludeIds = null)
    {
        var users = await _userRepository.GetSuggestionsAsync(currentUserId, count, excludeIds);
        var dtos = new List<UserResponseDto>();
        foreach (var user in users)
        {
            dtos.Add(await GetUserResponseAsync(user.Id, currentUserId));
        }

        return dtos;
    }
}

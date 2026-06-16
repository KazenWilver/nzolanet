using System;
using System.Collections.Generic;
using System.Linq;
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
            Email = user.Email ?? string.Empty,
            ProfilePhoto = user.ProfilePhoto,
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

        return await GetProfileAsync(userId, userId);
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

    public async Task<FollowResultDto> FollowUserAsync(Guid followerId, Guid followedId)
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
            return new FollowResultDto
            {
                Success = true,
                IsPending = false,
                Message = "Já segues este utilizador."
            };
        }

        var alreadyPending = await _followRepository.IsFollowPendingAsync(followerId, followedId);
        if (alreadyPending)
        {
            return new FollowResultDto
            {
                Success = true,
                IsPending = true,
                Message = "Pedido de seguimento já se encontra pendente."
            };
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
            return new FollowResultDto { Success = false, Message = "Não foi possível seguir o utilizador." };
        }

        return new FollowResultDto
        {
            Success = true,
            IsPending = followed.IsPrivate,
            Message = followed.IsPrivate 
                ? "Pedido de seguimento enviado com sucesso." 
                : "Começou a seguir o utilizador com sucesso."
        };
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
        return await _followRepository.UpdateFollowAsync(follow);
    }

    public async Task<bool> RejectFollowRequestAsync(Guid followedId, Guid followerId)
    {
        return await _followRepository.RemoveFollowAsync(followerId, followedId);
    }

    public async Task<IEnumerable<UserProfileDto>> GetFollowersAsync(Guid userId, Guid? currentUserId = null)
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

        var followers = user.Followers.Where(f => f.IsApproved).Select(f => f.Follower);
        var dtos = new List<UserProfileDto>();
        foreach (var f in followers)
        {
            dtos.Add(await GetProfileAsync(f.Id, currentUserId));
        }
        return dtos;
    }

    public async Task<IEnumerable<UserProfileDto>> GetFollowingAsync(Guid userId, Guid? currentUserId = null)
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

        var following = user.Following.Where(f => f.IsApproved).Select(f => f.Followed);
        var dtos = new List<UserProfileDto>();
        foreach (var f in following)
        {
            dtos.Add(await GetProfileAsync(f.Id, currentUserId));
        }
        return dtos;
    }

    public async Task<IEnumerable<UserProfileDto>> SearchUsersAsync(string query, Guid? currentUserId = null)
    {
        var users = await _userRepository.SearchAsync(query);
        var dtos = new List<UserProfileDto>();
        foreach (var user in users)
        {
            dtos.Add(await GetProfileAsync(user.Id, currentUserId));
        }
        return dtos;
    }
}

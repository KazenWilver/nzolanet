using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using NzolaNet.Domain.Entities;

namespace NzolaNet.Domain.Interfaces.Repositories;

public interface IFollowRepository
{
    Task<int> GetFollowersCountAsync(Guid userId);
    Task<int> GetFollowingCountAsync(Guid userId);
    Task<bool> IsFollowingAsync(Guid followerId, Guid followedId);
    Task<IEnumerable<Guid>> GetFollowedUserIdsAsync(Guid userId);
    Task<IEnumerable<Guid>> GetFollowerIdsAsync(Guid userId);
    Task<IEnumerable<Guid>> GetFollowingIdsAsync(Guid userId);
    Task<bool> AddFollowAsync(Follow follow);
    Task<bool> RemoveFollowAsync(Guid followerId, Guid followedId);
    Task<IEnumerable<Follow>> GetPendingFollowRequestsAsync(Guid userId);
    Task<Follow?> GetFollowRequestAsync(Guid followerId, Guid followedId);
    Task<bool> UpdateFollowAsync(Follow follow);
    Task<bool> IsFollowPendingAsync(Guid followerId, Guid followedId);
    Task<bool> HasIncomingFollowRequestAsync(Guid recipientId, Guid requesterId);
    Task<IReadOnlyList<TopFollowedProfileEntry>> GetTopFollowedProfilesAsync(int limit, DateTime? sinceUtc = null);
}

public sealed class TopFollowedProfileEntry
{
    public Guid UserId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string NomeUtilizador { get; set; } = string.Empty;
    public string? FotoPerfil { get; set; }
    public int TotalSeguidores { get; set; }
}

using System;
using System.Threading.Tasks;

namespace NzolaNet.Application.Interfaces;

public interface ILikeService
{
    Task<bool> ToggleLikeAsync(Guid userId, Guid postId);
    Task<int> GetLikeCountAsync(Guid postId);
    Task<bool> HasUserLikedAsync(Guid userId, Guid postId);
}

namespace NzolaNet.Application.Interfaces;

public interface ILikeService
{
    Task LikeAsync(Guid userId, Guid postId);
    Task UnlikeAsync(Guid userId, Guid postId);
    Task<bool> ToggleLikeAsync(Guid userId, Guid postId);
    Task<int> GetLikeCountAsync(Guid postId);
    Task<bool> HasUserLikedAsync(Guid userId, Guid postId);
}

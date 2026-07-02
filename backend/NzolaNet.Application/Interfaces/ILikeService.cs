namespace NzolaNet.Application.Interfaces;

public interface ILikeService
{
    Task LikeAsync(Guid userId, Guid postId);
    Task UnlikeAsync(Guid userId, Guid postId);
}

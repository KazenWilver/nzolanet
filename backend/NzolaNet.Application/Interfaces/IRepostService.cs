namespace NzolaNet.Application.Interfaces;

public interface IRepostService
{
    Task<(bool IsReposted, int RepostsCount)> ToggleRepostAsync(Guid userId, Guid postId);
    Task<int> GetRepostCountAsync(Guid postId);
    Task<bool> HasUserRepostedAsync(Guid userId, Guid postId);
}

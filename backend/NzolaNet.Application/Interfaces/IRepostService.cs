using NzolaNet.Application.DTOs.Publications;

namespace NzolaNet.Application.Interfaces;

public interface IRepostService
{
    Task<(bool IsReposted, int RepostsCount, PublicationResponseDto? QuotedPublication)> RepostAsync(
        Guid userId,
        Guid postId,
        string? quoteText);
}

using NzolaNet.Application.DTOs.Feedback;

namespace NzolaNet.Application.Interfaces;

/// <summary>
/// Application service for creating and listing user feedback.
/// </summary>
public interface IFeedbackService
{
    Task CreateAsync(Guid userId, string message);
    Task<IReadOnlyList<FeedbackDto>> GetAllAsync();
}

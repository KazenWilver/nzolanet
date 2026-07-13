using NzolaNet.Domain.Entities;

namespace NzolaNet.Domain.Interfaces.Repositories;

/// <summary>
/// Persistence operations for application feedback entries.
/// </summary>
public interface IFeedbackRepository
{
    Task<bool> CreateAsync(Feedback feedback);
    Task<IReadOnlyList<Feedback>> GetAllAsync();
}

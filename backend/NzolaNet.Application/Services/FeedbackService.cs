using NzolaNet.Application.DTOs.Feedback;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;

namespace NzolaNet.Application.Services;

/// <summary>
/// Handles validation and persistence of application feedback.
/// </summary>
public class FeedbackService : IFeedbackService
{
    private readonly IFeedbackRepository _feedbackRepository;

    public FeedbackService(IFeedbackRepository feedbackRepository)
    {
        _feedbackRepository = feedbackRepository;
    }

    public async Task CreateAsync(Guid userId, string message)
    {
        var normalized = message?.Trim() ?? string.Empty;
        if (normalized.Length < 5)
        {
            throw new ArgumentException("O feedback deve ter pelo menos 5 caracteres.");
        }

        if (normalized.Length > 4000)
        {
            throw new ArgumentException("O feedback não pode exceder 4000 caracteres.");
        }

        var feedback = new Feedback
        {
            UserId = userId,
            Message = normalized,
            CreatedAt = DateTime.UtcNow
        };

        await _feedbackRepository.CreateAsync(feedback);
    }

    public async Task<IReadOnlyList<FeedbackDto>> GetAllAsync()
    {
        var items = await _feedbackRepository.GetAllAsync();
        return items.Select(feedback => new FeedbackDto
        {
            Id = feedback.Id,
            UserId = feedback.UserId,
            Username = feedback.User.UserName ?? string.Empty,
            DisplayName = feedback.User.DisplayName,
            Email = feedback.User.Email,
            Message = feedback.Message,
            CreatedAt = feedback.CreatedAt
        }).ToList();
    }
}

using System.ComponentModel.DataAnnotations;

namespace NzolaNet.Application.DTOs.Feedback;

/// <summary>
/// Payload used when a signed-in user submits application feedback.
/// </summary>
public class CreateFeedbackDto
{
    [Required]
    [MinLength(5)]
    [MaxLength(4000)]
    public string Message { get; set; } = string.Empty;
}

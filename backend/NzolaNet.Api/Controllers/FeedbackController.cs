using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NzolaNet.Api.Helpers;
using NzolaNet.Application.DTOs.Feedback;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Api.Controllers;

/// <summary>
/// Lets authenticated users submit application feedback.
/// </summary>
[ApiController]
[Route("api/feedback")]
[Authorize]
public class FeedbackController : ControllerBase
{
    private readonly IFeedbackService _feedbackService;

    public FeedbackController(IFeedbackService feedbackService)
    {
        _feedbackService = feedbackService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFeedbackDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var userId = AuthClaimsHelper.GetUserId(User);
            await _feedbackService.CreateAsync(userId, dto.Message);
            return Ok(new { message = "Feedback enviado com sucesso. Obrigado!" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

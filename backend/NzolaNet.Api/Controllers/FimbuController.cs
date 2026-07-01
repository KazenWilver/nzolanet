using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NzolaNet.Api.Helpers;
using NzolaNet.Application.DTOs.Fimbu;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/fimbu")]
public class FimbuController : ControllerBase
{
    private readonly IFimbuChatService _fimbuChatService;

    public FimbuController(IFimbuChatService fimbuChatService)
    {
        _fimbuChatService = fimbuChatService;
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory(CancellationToken cancellationToken)
    {
        var userId = AuthClaimsHelper.GetUserId(User);
        var history = await _fimbuChatService.GetHistoryAsync(userId, cancellationToken);
        return Ok(history);
    }

    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] FimbuChatRequestDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Message))
        {
            return BadRequest(new { message = "A mensagem é obrigatória." });
        }

        try
        {
            var userId = AuthClaimsHelper.GetUserId(User);
            var response = await _fimbuChatService.SendMessageAsync(userId, dto.Message, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(503, new { message = ex.Message });
        }
    }

    [HttpDelete("history")]
    public async Task<IActionResult> ClearHistory(CancellationToken cancellationToken)
    {
        var userId = AuthClaimsHelper.GetUserId(User);
        await _fimbuChatService.ClearHistoryAsync(userId, cancellationToken);
        return NoContent();
    }
}

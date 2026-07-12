using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NzolaNet.Api.Helpers;
using NzolaNet.Application.DTOs.Fimbu;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Interfaces.Repositories;

namespace NzolaNet.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/fimbu")]
public class FimbuController : ControllerBase
{
    private readonly IFimbuChatService _fimbuChatService;
    private readonly IPlatformCounterRepository _platformCounterRepository;
    private readonly IFimbuActivityRepository _fimbuActivityRepository;

    public FimbuController(
        IFimbuChatService fimbuChatService,
        IPlatformCounterRepository platformCounterRepository,
        IFimbuActivityRepository fimbuActivityRepository)
    {
        _fimbuChatService = fimbuChatService;
        _platformCounterRepository = platformCounterRepository;
        _fimbuActivityRepository = fimbuActivityRepository;
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
            await _platformCounterRepository.IncrementAsync(IPlatformCounterRepository.Keys.FimbuInteractions);
            await _fimbuActivityRepository.RegisterInteractionAsync(userId);
            var response = await _fimbuChatService.SendMessageAsync(userId, dto.Message, cancellationToken);
            await _platformCounterRepository.IncrementAsync(IPlatformCounterRepository.Keys.FimbuMessages);
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

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NzolaNet.Api.Helpers;
using NzolaNet.Application.DTOs.Conversations;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ConversationsController : ControllerBase
{
    private readonly IConversationService _conversationService;
    private readonly IChatRealtimeNotifier _chatRealtimeNotifier;

    public ConversationsController(
        IConversationService conversationService,
        IChatRealtimeNotifier chatRealtimeNotifier)
    {
        _conversationService = conversationService;
        _chatRealtimeNotifier = chatRealtimeNotifier;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = AuthClaimsHelper.GetUserId(User);
        var conversations = await _conversationService.GetConversationsAsync(userId);
        return Ok(conversations);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var userId = AuthClaimsHelper.GetUserId(User);
            var conversation = await _conversationService.GetConversationAsync(userId, id);
            return Ok(conversation);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenResultHelper.Create(ex.Message);
        }
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = AuthClaimsHelper.GetUserId(User);
        var count = await _conversationService.GetUnreadCountAsync(userId);
        return Ok(count);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateConversationDto dto)
    {
        try
        {
            var userId = AuthClaimsHelper.GetUserId(User);
            var conversation = await _conversationService.GetOrCreateConversationAsync(userId, dto.ParticipantId);
            return Ok(conversation);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenResultHelper.Create(ex.Message);
        }
    }

    [HttpPost("group")]
    public async Task<IActionResult> CreateGroup([FromBody] CreateGroupConversationDto dto)
    {
        try
        {
            var userId = AuthClaimsHelper.GetUserId(User);
            var conversation = await _conversationService.CreateGroupConversationAsync(userId, dto);
            return Ok(conversation);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/participants")]
    public async Task<IActionResult> AddParticipants(Guid id, [FromBody] AddGroupParticipantsDto dto)
    {
        try
        {
            var userId = AuthClaimsHelper.GetUserId(User);
            var conversation = await _conversationService.AddGroupParticipantsAsync(
                userId,
                id,
                dto.ParticipantIds?.ToList() ?? new List<Guid>());
            return Ok(conversation);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenResultHelper.Create(ex.Message);
        }
    }

    [HttpPatch("{id:guid}/group")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdateGroup(
        Guid id,
        [FromForm] string? title,
        [FromForm] string? description,
        [FromForm] IFormFile? image)
    {
        try
        {
            var userId = AuthClaimsHelper.GetUserId(User);
            var conversation = await _conversationService.UpdateGroupAsync(
                userId,
                id,
                new UpdateGroupConversationDto { Title = title, Description = description },
                image);
            return Ok(conversation);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenResultHelper.Create(ex.Message);
        }
    }

    [HttpGet("{id:guid}/messages")]
    public async Task<IActionResult> GetMessages(
        Guid id,
        [FromQuery] int limit = 50,
        [FromQuery] DateTime? before = null)
    {
        try
        {
            var userId = AuthClaimsHelper.GetUserId(User);
            var messages = await _conversationService.GetMessagesAsync(userId, id, limit, before);
            return Ok(messages);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenResultHelper.Create(ex.Message);
        }
    }

    [HttpPost("{id:guid}/messages")]
    public async Task<IActionResult> SendMessage(Guid id, [FromBody] SendMessageDto dto)
    {
        try
        {
            var userId = AuthClaimsHelper.GetUserId(User);
            var message = await _conversationService.SendMessageAsync(
                userId,
                id,
                dto.Text,
                replyToMessageId: dto.ReplyToMessageId,
                remoteImageUrl: dto.RemoteImageUrl);
            await _chatRealtimeNotifier.NotifyMessageAsync(id, message, userId);
            return Ok(message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenResultHelper.Create(ex.Message);
        }
    }

    [HttpPost("{id:guid}/messages/media")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> SendMessageWithMedia(
        Guid id,
        [FromForm] string? text,
        [FromForm] Guid? replyToMessageId,
        [FromForm] string? remoteImageUrl,
        [FromForm] IFormFile? image,
        [FromForm] IFormFile? video)
    {
        try
        {
            var userId = AuthClaimsHelper.GetUserId(User);
            var message = await _conversationService.SendMessageAsync(
                userId,
                id,
                text,
                image,
                video,
                replyToMessageId,
                remoteImageUrl);
            await _chatRealtimeNotifier.NotifyMessageAsync(id, message, userId);
            return Ok(message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenResultHelper.Create(ex.Message);
        }
    }

    [HttpPost("{id:guid}/messages/{messageId:guid}/reactions")]
    public async Task<IActionResult> ToggleReaction(
        Guid id,
        Guid messageId,
        [FromBody] ToggleMessageReactionDto dto)
    {
        try
        {
            var userId = AuthClaimsHelper.GetUserId(User);
            var reactions = await _conversationService.ToggleReactionAsync(userId, id, messageId, dto.Emoji);
            await _chatRealtimeNotifier.NotifyReactionChangedAsync(id, messageId, reactions);
            return Ok(new { reactions });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenResultHelper.Create(ex.Message);
        }
    }

    [HttpPatch("{id:guid}/messages/{messageId:guid}")]
    public async Task<IActionResult> EditMessage(Guid id, Guid messageId, [FromBody] EditMessageDto dto)
    {
        try
        {
            var userId = AuthClaimsHelper.GetUserId(User);
            var message = await _conversationService.EditMessageAsync(userId, id, messageId, dto.Text);
            await _chatRealtimeNotifier.NotifyMessageEditedAsync(id, message, userId);
            return Ok(message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenResultHelper.Create(ex.Message);
        }
    }

    [HttpDelete("{id:guid}/messages/{messageId:guid}")]
    public async Task<IActionResult> DeleteMessage(
        Guid id,
        Guid messageId,
        [FromQuery] string? scope,
        [FromBody] DeleteMessageDto? dto = null)
    {
        try
        {
            var userId = AuthClaimsHelper.GetUserId(User);
            var deleteScope = scope ?? dto?.Scope ?? "self";
            await _conversationService.DeleteMessageAsync(userId, id, messageId, deleteScope);
            if (string.Equals(deleteScope, "everyone", StringComparison.OrdinalIgnoreCase))
            {
                await _chatRealtimeNotifier.NotifyMessageDeletedAsync(id, messageId, deleteScope, userId);
            }
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenResultHelper.Create(ex.Message);
        }
    }

    [HttpPost("{id:guid}/messages/{messageId:guid}/forward")]
    public async Task<IActionResult> ForwardMessage(Guid id, Guid messageId, [FromBody] ForwardMessageDto dto)
    {
        try
        {
            var userId = AuthClaimsHelper.GetUserId(User);
            var forwarded = await _conversationService.ForwardMessageAsync(
                userId,
                id,
                messageId,
                dto.TargetConversationIds,
                dto.Caption);

            foreach (var message in forwarded)
            {
                await _chatRealtimeNotifier.NotifyMessageAsync(message.ConversationId, message, userId);
            }

            return Ok(forwarded);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenResultHelper.Create(ex.Message);
        }
    }

    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        try
        {
            var userId = AuthClaimsHelper.GetUserId(User);
            var readAt = await _conversationService.MarkAsReadAsync(userId, id);
            await _chatRealtimeNotifier.NotifyReadReceiptAsync(id, userId, readAt);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenResultHelper.Create(ex.Message);
        }
    }
}

namespace NzolaNet.Application.DTOs.Conversations;

public class MessageResponseDto
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public Guid SenderId { get; set; }
    public string SenderUsername { get; set; } = string.Empty;
    public string? SenderDisplayName { get; set; }
    public string? SenderPhotoUrl { get; set; }
    public string Text { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? VideoUrl { get; set; }
    public bool IsGif { get; set; }
    public MessageReplyPreviewDto? ReplyTo { get; set; }
    public IReadOnlyList<MessageReactionSummaryDto> Reactions { get; set; } = Array.Empty<MessageReactionSummaryDto>();
    public DateTime CreatedAt { get; set; }
    public bool IsMine { get; set; }
    public bool IsRead { get; set; }
}

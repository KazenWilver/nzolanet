namespace NzolaNet.Application.DTOs.Conversations;

public class ConversationListItemDto
{
    public Guid Id { get; set; }
    public Guid OtherUserId { get; set; }
    public string OtherUsername { get; set; } = string.Empty;
    public string? OtherDisplayName { get; set; }
    public string? OtherPhotoUrl { get; set; }
    public string? LastMessageText { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public int UnreadCount { get; set; }
}

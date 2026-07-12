namespace NzolaNet.Application.DTOs.Conversations;

public class ConversationDetailDto
{
    public Guid Id { get; set; }
    public Guid? OtherUserId { get; set; }
    public string? OtherUsername { get; set; }
    public string? OtherDisplayName { get; set; }
    public string? OtherPhotoUrl { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsGroup { get; set; }
    public int ParticipantCount { get; set; }
    public string? LastMessageText { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public int UnreadCount { get; set; }
    public bool IsGroupCreator { get; set; }
    public IReadOnlyList<ConversationParticipantDto> Participants { get; set; } = Array.Empty<ConversationParticipantDto>();
}

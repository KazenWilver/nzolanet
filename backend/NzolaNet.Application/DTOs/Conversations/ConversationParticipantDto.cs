namespace NzolaNet.Application.DTOs.Conversations;

public class ConversationParticipantDto
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? PhotoUrl { get; set; }
}

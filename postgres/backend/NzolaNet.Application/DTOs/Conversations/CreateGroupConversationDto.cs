namespace NzolaNet.Application.DTOs.Conversations;

public class CreateGroupConversationDto
{
    public string Title { get; set; } = string.Empty;
    public Guid[] ParticipantIds { get; set; } = Array.Empty<Guid>();
}

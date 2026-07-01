namespace NzolaNet.Application.DTOs.Conversations;

public class ForwardMessageDto
{
    public Guid[] TargetConversationIds { get; set; } = Array.Empty<Guid>();
    public string? Caption { get; set; }
}

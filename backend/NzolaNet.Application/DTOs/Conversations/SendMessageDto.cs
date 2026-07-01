namespace NzolaNet.Application.DTOs.Conversations;

public class SendMessageDto
{
    public string Text { get; set; } = string.Empty;
    public Guid? ReplyToMessageId { get; set; }
}

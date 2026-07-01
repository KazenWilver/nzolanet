namespace NzolaNet.Application.DTOs.Conversations;

public class MessageReactionSummaryDto
{
    public string Emoji { get; set; } = string.Empty;
    public int Count { get; set; }
    public bool ReactedByMe { get; set; }
}

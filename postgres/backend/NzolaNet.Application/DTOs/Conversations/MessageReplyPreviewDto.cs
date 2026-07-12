namespace NzolaNet.Application.DTOs.Conversations;

public class MessageReplyPreviewDto
{
    public Guid Id { get; set; }
    public Guid SenderId { get; set; }
    public string SenderUsername { get; set; } = string.Empty;
    public string? SenderDisplayName { get; set; }
    public string Text { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? VideoUrl { get; set; }
    public string? AudioUrl { get; set; }
    public string? DocumentUrl { get; set; }
    public string? DocumentFileName { get; set; }
    public bool IsGif { get; set; }
}

namespace NzolaNet.Application.DTOs.Comments;

public class CommentResponseDto
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid PublicationId { get; set; }
    public Guid AuthorId { get; set; }
    public string AuthorUsername { get; set; } = string.Empty;
    public string? AuthorDisplayName { get; set; }
    public string? AuthorPhotoUrl { get; set; }
}

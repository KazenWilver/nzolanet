namespace NzolaNet.Application.DTOs.Publications;

public class PublicationResponseDto
{
    public Guid Id { get; set; }
    public string? Text { get; set; }
    public string? ImageUrl { get; set; }
    public string? VideoUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid AuthorId { get; set; }
    public string AuthorUsername { get; set; } = string.Empty;
    public string? AuthorDisplayName { get; set; }
    public string? AuthorPhotoUrl { get; set; }
    public int LikesCount { get; set; }
    public int CommentsCount { get; set; }
    public bool? HasLiked { get; set; }
}

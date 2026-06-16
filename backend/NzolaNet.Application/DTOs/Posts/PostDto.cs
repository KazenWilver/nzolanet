using System;

namespace NzolaNet.Application.DTOs.Posts;

public class PostDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserPhoto { get; set; }
    public string Text { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? VideoUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public int CommentsCount { get; set; }
}

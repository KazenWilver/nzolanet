using System;

namespace NzolaNet.Application.DTOs.Comments;

public class CommentDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserPhoto { get; set; }
    public Guid PostId { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

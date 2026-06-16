using System;
using System.Collections.Generic;

namespace NzolaNet.Domain.Entities;

public class Post : Baze
{
    public Guid UserId { get; set; }
    public virtual User User { get; set; } = null!;

    public string Text { get; set; } = string.Empty;
    public string? ImagePath { get; set; }
    public string? VideoPath { get; set; }

    // Relações (Navigation Properties)
    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
}

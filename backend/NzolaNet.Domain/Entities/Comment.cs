using System;

namespace NzolaNet.Domain.Entities;

public class Comment : Baze
{
    public Guid UserId { get; set; }
    public virtual User User { get; set; } = null!;

    public Guid PostId { get; set; }
    public virtual Post Post { get; set; } = null!;

    public string Text { get; set; } = string.Empty;
}

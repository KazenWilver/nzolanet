using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;

namespace NzolaNet.Domain.Entities;

public class User : IdentityUser<Guid>
{
    public string? DisplayName { get; set; }
    public string? ProfilePhoto { get; set; }
    public bool IsPrivate { get; set; } = false;
    public string? Bio { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Relações (Navigation Properties)
    public virtual ICollection<Post> Posts { get; set; } = new List<Post>();
    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
    
    // Relações de Seguidores (Muitos-para-Muitos auto-relacionado)
    public virtual ICollection<Follow> Followers { get; set; } = new List<Follow>();
    public virtual ICollection<Follow> Following { get; set; } = new List<Follow>();
}

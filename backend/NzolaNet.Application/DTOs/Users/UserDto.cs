using System;

namespace NzolaNet.Application.DTOs.Users;

public class UserDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? ProfilePhoto { get; set; }
    public bool IsPrivate { get; set; }
    public string? Bio { get; set; }
    public DateTime CreatedAt { get; set; }
}

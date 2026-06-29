using System.ComponentModel.DataAnnotations;

namespace NzolaNet.Application.DTOs.Admin;

public class AdminLoginDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    public string? Password { get; set; }

    public string? Senha { get; set; }
}

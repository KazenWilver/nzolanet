using System.ComponentModel.DataAnnotations;

namespace NzolaNet.Application.DTOs.Admin;

public class AdminRegisterDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [MinLength(3)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MinLength(2)]
    public string DisplayName { get; set; } = string.Empty;

    public string? InviteCode { get; set; }
}

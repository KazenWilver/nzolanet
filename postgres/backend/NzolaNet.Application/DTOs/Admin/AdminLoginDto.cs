using System.ComponentModel.DataAnnotations;

namespace NzolaNet.Application.DTOs.Admin;

/// <summary>
/// Carries the credentials submitted on the administrator login screen.
/// </summary>
public class AdminLoginDto
{
    [Required(ErrorMessage = "O email é obrigatório.")]
    [EmailAddress(ErrorMessage = "O email é inválido.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "A palavra-passe é obrigatória.")]
    public string Password { get; set; } = string.Empty;
}

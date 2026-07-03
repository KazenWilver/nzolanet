using System.ComponentModel.DataAnnotations;

namespace NzolaNet.Application.DTOs.Admin;

/// <summary>
/// Carries the data submitted on the administrator sign-up screen. Creating an
/// administrator account requires a valid invite code, preventing anyone from
/// self-promoting to administrator.
/// </summary>
public class AdminRegisterDto
{
    [Required(ErrorMessage = "O nome de utilizador é obrigatório.")]
    [MinLength(3, ErrorMessage = "O nome de utilizador deve ter pelo menos 3 caracteres.")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "O email é obrigatório.")]
    [EmailAddress(ErrorMessage = "O email é inválido.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "A palavra-passe é obrigatória.")]
    [MinLength(6, ErrorMessage = "A palavra-passe deve ter pelo menos 6 caracteres.")]
    public string Password { get; set; } = string.Empty;

    public string? DisplayName { get; set; }

    [Required(ErrorMessage = "O código de administrador é obrigatório.")]
    public string AdminCode { get; set; } = string.Empty;
}

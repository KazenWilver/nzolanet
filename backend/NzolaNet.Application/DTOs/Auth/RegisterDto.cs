using System.ComponentModel.DataAnnotations;

namespace NzolaNet.Application.DTOs.Auth;

public class RegisterDto
{
    [Required(ErrorMessage = "O nome de utilizador é obrigatório.")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "O nome de utilizador deve ter entre 3 e 50 caracteres.")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "O email é obrigatório.")]
    [EmailAddress(ErrorMessage = "O formato do email é inválido.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "A palavra-passe é obrigatória.")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "A palavra-passe deve ter pelo menos 6 caracteres.")]
    public string Password { get; set; } = string.Empty;
}

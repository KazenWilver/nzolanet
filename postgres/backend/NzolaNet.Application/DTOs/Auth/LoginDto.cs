using System.ComponentModel.DataAnnotations;

namespace NzolaNet.Application.DTOs.Auth;

public class LoginDto
{
    [Required(ErrorMessage = "O email é obrigatório.")]
    [EmailAddress(ErrorMessage = "O formato do email é inválido.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "A palavra-passe é obrigatória.")]
    public string Password { get; set; } = string.Empty;
}

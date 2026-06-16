using System.ComponentModel.DataAnnotations;

namespace NzolaNet.Application.DTOs.Auth;

public class LoginDto
{
    [Required(ErrorMessage = "O nome de utilizador ou email é obrigatório.")]
    public string UsernameOrEmail { get; set; } = string.Empty;

    [Required(ErrorMessage = "A palavra-passe é obrigatória.")]
    public string Password { get; set; } = string.Empty;
}

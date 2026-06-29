using System.ComponentModel.DataAnnotations;

namespace NzolaNet.Application.DTOs.Auth;

public class ChangePasswordDto
{
    [Required(ErrorMessage = "A palavra-passe actual é obrigatória.")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "A nova palavra-passe é obrigatória.")]
    [MinLength(6, ErrorMessage = "A nova palavra-passe deve ter pelo menos 6 caracteres.")]
    public string NewPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "A confirmação da palavra-passe é obrigatória.")]
    public string ConfirmNewPassword { get; set; } = string.Empty;
}

using System.ComponentModel.DataAnnotations;

namespace NzolaNet.Application.DTOs.Auth;

public class ForgotPasswordDto
{
    [Required(ErrorMessage = "O email é obrigatório.")]
    [EmailAddress(ErrorMessage = "O formato do email é inválido.")]
    public string Email { get; set; } = string.Empty;
}

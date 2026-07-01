namespace NzolaNet.Application.DTOs.Auth;

public class ForgotPasswordResponseDto
{
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Apenas em desenvolvimento — link directo quando o email não está configurado.
    /// </summary>
    public string? DevResetLink { get; set; }
}

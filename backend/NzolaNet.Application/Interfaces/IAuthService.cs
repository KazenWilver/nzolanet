using System.Threading.Tasks;
using NzolaNet.Application.DTOs.Auth;
using NzolaNet.Application.DTOs.Users;

namespace NzolaNet.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);
    Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
    Task<string> ForgotPasswordAsync(ForgotPasswordDto forgotPasswordDto);
    Task<string> ChangePasswordAsync(Guid userId, ChangePasswordDto changePasswordDto);
}

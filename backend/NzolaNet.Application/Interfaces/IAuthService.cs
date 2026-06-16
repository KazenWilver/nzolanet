using System.Threading.Tasks;
using NzolaNet.Application.DTOs.Auth;

namespace NzolaNet.Application.Interfaces;

public interface IAuthService
{
    Task<string> RegisterAsync(RegisterDto registerDto);
    Task<string> LoginAsync(LoginDto loginDto);
}

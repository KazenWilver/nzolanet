using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using NzolaNet.Application.DTOs.Auth;
using NzolaNet.Application.DTOs.Users;
using NzolaNet.Application.Exceptions;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;

namespace NzolaNet.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenService _tokenService;
    private readonly IUserService _userService;
    private readonly SignInManager<User> _signInManager;
    private readonly UserManager<User> _userManager;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;

    public AuthService(
        IUserRepository userRepository,
        IJwtTokenService tokenService,
        IUserService userService,
        SignInManager<User> signInManager,
        UserManager<User> userManager,
        IEmailService emailService,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
        _userService = userService;
        _signInManager = signInManager;
        _userManager = userManager;
        _emailService = emailService;
        _configuration = configuration;
        _environment = environment;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
    {
        if (await _userRepository.ExistsByEmailAsync(registerDto.Email))
        {
            throw new ConflictException("O email já se encontra registado.");
        }

        if (await _userRepository.ExistsByUsernameAsync(registerDto.Username))
        {
            throw new ConflictException("O nome de utilizador já está a ser utilizado.");
        }

        var user = new User
        {
            UserName = registerDto.Username,
            Email = registerDto.Email,
            DisplayName = registerDto.DisplayName,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _userRepository.CreateAsync(user, registerDto.Password);
        if (!created)
        {
            throw new ArgumentException("Erro ao criar o utilizador. Verifica se a password cumpre os requisitos.");
        }

        await _userRepository.AddToRoleAsync(user, "User");

        var token = await _tokenService.GenerateTokenAsync(user);
        var userResponse = await _userService.GetUserResponseAsync(user.Id, user.Id);

        return new AuthResponseDto
        {
            Token = token,
            User = userResponse
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
    {
        var user = await _userRepository.GetByEmailAsync(loginDto.Email);
        if (user == null)
        {
            throw new InvalidCredentialsException();
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);
        if (!result.Succeeded)
        {
            throw new InvalidCredentialsException();
        }

        var token = await _tokenService.GenerateTokenAsync(user);
        var userResponse = await _userService.GetUserResponseAsync(user.Id, user.Id);

        return new AuthResponseDto
        {
            Token = token,
            User = userResponse
        };
    }

    public async Task<ForgotPasswordResponseDto> ForgotPasswordAsync(ForgotPasswordDto forgotPasswordDto)
    {
        const string safeMessage = "Se o email existir, receberás instruções para recuperar a palavra-passe.";

        var user = await _userManager.FindByEmailAsync(forgotPasswordDto.Email);
        if (user == null || string.IsNullOrWhiteSpace(user.Email))
        {
            return new ForgotPasswordResponseDto { Message = safeMessage };
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
        var frontendBaseUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:4200";
        var resetLink =
            $"{frontendBaseUrl.TrimEnd('/')}/reset-password?email={Uri.EscapeDataString(user.Email)}&token={encodedToken}";

        await _emailService.SendPasswordResetEmailAsync(user.Email, resetLink);

        var exposeLink = _configuration.GetValue<bool>("AppSettings:ExposePasswordResetLink");

        return new ForgotPasswordResponseDto
        {
            Message = safeMessage,
            DevResetLink = exposeLink || _environment.IsDevelopment() ? resetLink : null
        };
    }

    public async Task<string> ResetPasswordAsync(ResetPasswordDto resetPasswordDto)
    {
        if (resetPasswordDto.NewPassword != resetPasswordDto.ConfirmNewPassword)
        {
            throw new ArgumentException("A nova palavra-passe e a confirmação não coincidem.");
        }

        var user = await _userManager.FindByEmailAsync(resetPasswordDto.Email);
        if (user == null)
        {
            throw new ArgumentException("Não foi possível redefinir a palavra-passe. O link pode ter expirado.");
        }

        string decodedToken;
        try
        {
            decodedToken = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(resetPasswordDto.Token));
        }
        catch (FormatException)
        {
            throw new ArgumentException("Link de recuperação inválido.");
        }

        var result = await _userManager.ResetPasswordAsync(user, decodedToken, resetPasswordDto.NewPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(error => error.Description));
            throw new ArgumentException(string.IsNullOrWhiteSpace(errors)
                ? "Não foi possível redefinir a palavra-passe."
                : errors);
        }

        return "Palavra-passe redefinida com sucesso. Já podes iniciar sessão.";
    }

    public async Task<string> ChangePasswordAsync(Guid userId, ChangePasswordDto changePasswordDto)
    {
        if (changePasswordDto.NewPassword != changePasswordDto.ConfirmNewPassword)
        {
            throw new ArgumentException("A nova palavra-passe e a confirmação não coincidem.");
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            throw new ArgumentException("Utilizador não encontrado.");
        }

        var currentPasswordValid = await _signInManager.CheckPasswordSignInAsync(
            user,
            changePasswordDto.CurrentPassword,
            lockoutOnFailure: false);

        if (!currentPasswordValid.Succeeded)
        {
            throw new InvalidCredentialsException("Palavra-passe actual incorrecta.");
        }

        var result = await _userManager.ChangePasswordAsync(
            user,
            changePasswordDto.CurrentPassword,
            changePasswordDto.NewPassword);

        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(error => error.Description));
            throw new ArgumentException(string.IsNullOrWhiteSpace(errors)
                ? "Não foi possível alterar a palavra-passe."
                : errors);
        }

        return "Palavra-passe alterada com sucesso.";
    }
}

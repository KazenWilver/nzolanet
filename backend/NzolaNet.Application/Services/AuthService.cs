using Microsoft.AspNetCore.Identity;
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

    public AuthService(
        IUserRepository userRepository,
        IJwtTokenService tokenService,
        IUserService userService,
        SignInManager<User> signInManager)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
        _userService = userService;
        _signInManager = signInManager;
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

    public Task<string> ForgotPasswordAsync(ForgotPasswordDto forgotPasswordDto)
    {
        // TODO: integrar serviço de email
        _ = forgotPasswordDto;
        return Task.FromResult("Se o email existir, receberás instruções.");
    }
}

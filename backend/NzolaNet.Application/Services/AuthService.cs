using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using NzolaNet.Application.DTOs.Auth;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;

namespace NzolaNet.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenService _tokenService;
    private readonly SignInManager<User> _signInManager;

    public AuthService(
        IUserRepository userRepository, 
        IJwtTokenService tokenService, 
        SignInManager<User> signInManager)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
        _signInManager = signInManager;
    }

    public async Task<string> RegisterAsync(RegisterDto registerDto)
    {
        if (await _userRepository.ExistsByEmailAsync(registerDto.Email))
        {
            throw new ArgumentException("O email já se encontra registado.");
        }

        if (await _userRepository.ExistsByUsernameAsync(registerDto.Username))
        {
            throw new ArgumentException("O nome de utilizador já está a ser utilizado.");
        }

        var user = new User
        {
            UserName = registerDto.Username,
            Email = registerDto.Email,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _userRepository.CreateAsync(user, registerDto.Password);
        if (!created)
        {
            throw new ArgumentException("Erro ao criar o utilizador. Verifica se a password cumpre os requisitos.");
        }

        return _tokenService.GenerateToken(user);
    }

    public async Task<string> LoginAsync(LoginDto loginDto)
    {
        User? user = null;

        if (loginDto.UsernameOrEmail.Contains("@"))
        {
            user = await _userRepository.GetByEmailAsync(loginDto.UsernameOrEmail);
        }
        else
        {
            user = await _userRepository.GetByUsernameAsync(loginDto.UsernameOrEmail);
        }

        if (user == null)
        {
            throw new ArgumentException("Credenciais inválidas.");
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);
        if (!result.Succeeded)
        {
            throw new ArgumentException("Credenciais inválidas.");
        }

        return _tokenService.GenerateToken(user);
    }
}

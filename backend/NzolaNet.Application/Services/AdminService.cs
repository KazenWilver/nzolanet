using NzolaNet.Application.DTOs.Admin;
using NzolaNet.Application.DTOs.Auth;
using NzolaNet.Application.Exceptions;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Interfaces.Repositories;

namespace NzolaNet.Application.Services;

public class AdminService : IAdminService
{
    private readonly IAuthService _authService;
    private readonly IUserRepository _userRepository;
    private readonly ICommentService _commentService;
    private readonly IPostRepository _postRepository;
    private readonly ICommentRepository _commentRepository;
    private readonly ILikeRepository _likeRepository;
    private readonly IContentReportRepository _contentReportRepository;

    public AdminService(
        IAuthService authService,
        IUserRepository userRepository,
        ICommentService commentService,
        IPostRepository postRepository,
        ICommentRepository commentRepository,
        ILikeRepository likeRepository,
        IContentReportRepository contentReportRepository)
    {
        _authService = authService;
        _userRepository = userRepository;
        _commentService = commentService;
        _postRepository = postRepository;
        _commentRepository = commentRepository;
        _likeRepository = likeRepository;
        _contentReportRepository = contentReportRepository;
    }

    public async Task<AuthResponseDto> LoginAsync(AdminLoginDto loginDto)
    {
        var password = !string.IsNullOrWhiteSpace(loginDto.Password)
            ? loginDto.Password
            : loginDto.Senha;

        if (string.IsNullOrWhiteSpace(password))
        {
            throw new ArgumentException("A palavra-passe é obrigatória.");
        }

        var response = await _authService.LoginAsync(new LoginDto
        {
            Email = loginDto.Email,
            Password = password
        });

        var roles = await _userRepository.GetRolesAsync(response.User.Id);
        if (!roles.Contains("Admin"))
        {
            throw new UnauthorizedAccessException("Acesso reservado a administradores.");
        }

        return response;
    }

    public async Task<AdminMetricsDto> GetMetricsAsync()
    {
        return new AdminMetricsDto
        {
            TotalUtilizadores = await _userRepository.GetTotalCountAsync(),
            TotalPublicacoes = await _postRepository.GetTotalCountAsync(),
            TotalComentarios = await _commentRepository.GetTotalCountAsync(),
            TotalComentariosDenunciados = await _contentReportRepository.GetTotalReportedCommentsAsync(),
            TotalBazes = await _likeRepository.GetTotalCountAsync()
        };
    }

    public Task<IEnumerable<AdminReportedCommentDto>> GetReportedCommentsAsync()
    {
        return Task.FromResult<IEnumerable<AdminReportedCommentDto>>(Array.Empty<AdminReportedCommentDto>());
    }

    public async Task DeleteCommentAsync(Guid adminUserId, Guid commentId)
    {
        await _commentService.DeleteAsync(adminUserId, commentId, isAdmin: true);
    }
}

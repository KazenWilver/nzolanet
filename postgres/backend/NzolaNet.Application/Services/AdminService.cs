using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using NzolaNet.Application.DTOs.Admin;
using NzolaNet.Application.DTOs.Auth;
using NzolaNet.Application.Exceptions;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Entities;
using NzolaNet.Domain.Interfaces.Repositories;

namespace NzolaNet.Application.Services;

/// <summary>
/// Handles administrator authentication and the moderation actions available
/// on the administrator dashboard.
/// </summary>
public class AdminService : IAdminService
{
    private const string AdminRoleName = "Admin";

    private readonly IUserRepository _userRepository;
    private readonly IPostRepository _postRepository;
    private readonly ICommentRepository _commentRepository;
    private readonly ILikeRepository _likeRepository;
    private readonly IFollowRepository _followRepository;
    private readonly IContentReportRepository _contentReportRepository;
    private readonly IConversationRepository _conversationRepository;
    private readonly IPlatformCounterRepository _platformCounterRepository;
    private readonly IFimbuActivityRepository _fimbuActivityRepository;
    private readonly IUserPresenceService _userPresenceService;
    private readonly IPostService _postService;
    private readonly ICommentService _commentService;
    private readonly IUserService _userService;
    private readonly IJwtTokenService _tokenService;
    private readonly SignInManager<User> _signInManager;
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _configuration;

    public AdminService(
        IUserRepository userRepository,
        IPostRepository postRepository,
        ICommentRepository commentRepository,
        ILikeRepository likeRepository,
        IFollowRepository followRepository,
        IContentReportRepository contentReportRepository,
        IConversationRepository conversationRepository,
        IPlatformCounterRepository platformCounterRepository,
        IFimbuActivityRepository fimbuActivityRepository,
        IUserPresenceService userPresenceService,
        IPostService postService,
        ICommentService commentService,
        IUserService userService,
        IJwtTokenService tokenService,
        SignInManager<User> signInManager,
        UserManager<User> userManager,
        IConfiguration configuration)
    {
        _userRepository = userRepository;
        _postRepository = postRepository;
        _commentRepository = commentRepository;
        _likeRepository = likeRepository;
        _followRepository = followRepository;
        _contentReportRepository = contentReportRepository;
        _conversationRepository = conversationRepository;
        _platformCounterRepository = platformCounterRepository;
        _fimbuActivityRepository = fimbuActivityRepository;
        _userPresenceService = userPresenceService;
        _postService = postService;
        _commentService = commentService;
        _userService = userService;
        _tokenService = tokenService;
        _signInManager = signInManager;
        _userManager = userManager;
        _configuration = configuration;
    }

    public async Task<AuthResponseDto> LoginAsync(AdminLoginDto loginDto)
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

        var roles = await _userManager.GetRolesAsync(user);
        if (!roles.Contains(AdminRoleName))
        {
            throw new InvalidCredentialsException("Esta conta não tem privilégios de administrador.");
        }

        return await BuildAuthResponseAsync(user);
    }

    public async Task<AuthResponseDto> RegisterAsync(AdminRegisterDto registerDto)
    {
        var expectedCode = ResolveAdminRegistrationCode();
        if (string.IsNullOrWhiteSpace(expectedCode) ||
            !string.Equals(registerDto.AdminCode.Trim(), expectedCode, StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("Código de administrador inválido.");
        }

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
            throw new ArgumentException("Erro ao criar o administrador. Verifica se a password cumpre os requisitos.");
        }

        await _userRepository.AddToRoleAsync(user, AdminRoleName);

        return await BuildAuthResponseAsync(user);
    }

    public async Task<AdminMetricsDto> GetMetricsAsync()
    {
        var totalUtilizadores = await _userRepository.GetTotalCountAsync();
        var totalAdministradores = (await _userManager.GetUsersInRoleAsync(AdminRoleName)).Count;
        var totalComuns = Math.Max(0, totalUtilizadores - totalAdministradores);
        var totalOnline = Math.Min(_userPresenceService.GetOnlineUsersCount(), totalUtilizadores);

        var fotografias = await _postRepository.GetTotalWithImageAsync()
            + await _commentRepository.GetTotalWithImageAsync();
        var videos = await _postRepository.GetTotalWithVideoAsync()
            + await _commentRepository.GetTotalWithVideoAsync();

        var topHashtags = await _postRepository.GetTopUsedHashtagsAsync(10);
        var topSeguidos = await _followRepository.GetTopFollowedProfilesAsync(10);
        var topFimbu = await _fimbuActivityRepository.GetTopInteractingUsersAsync(10);

        return new AdminMetricsDto
        {
            TotalUtilizadores = totalUtilizadores,
            TotalUtilizadoresComuns = totalComuns,
            TotalAdministradores = totalAdministradores,
            TotalUtilizadoresOnline = totalOnline,
            TotalUtilizadoresOffline = totalUtilizadores - totalOnline,
            TotalPublicacoes = await _postRepository.GetTotalCountAsync(),
            TotalComentarios = await _commentRepository.GetTotalCountAsync(),
            TotalBazes = await _likeRepository.GetTotalCountAsync(),
            TotalDenuncias = await _contentReportRepository.GetTotalReportsCountAsync(),
            TotalPublicacoesDenunciadas = await _contentReportRepository.GetTotalReportedPostsAsync(),
            TotalComentariosDenunciados = await _contentReportRepository.GetTotalReportedCommentsAsync(),
            TotalHashtagsCriadas = await _postRepository.GetTotalCreatedHashtagsAsync(),
            TotalFotografiasPartilhadas = fotografias,
            TotalVideosPartilhados = videos,
            TotalChatsCriados = await _conversationRepository.GetTotalDirectConversationsCountAsync(),
            TotalGruposCriados = await _conversationRepository.GetTotalGroupsCountAsync(),
            TotalInteracoesFimbu = await _platformCounterRepository.GetAsync(IPlatformCounterRepository.Keys.FimbuInteractions),
            TotalMensagensFimbu = await _platformCounterRepository.GetAsync(IPlatformCounterRepository.Keys.FimbuMessages),
            TopHashtags = topHashtags
                .Select(entry => new AdminTopHashtagDto
                {
                    Tag = entry.Hashtag,
                    TotalUtilizacoes = entry.Usos
                })
                .ToList(),
            TopPerfisSeguidos = topSeguidos
                .Select(entry => new AdminTopFollowedDto
                {
                    Id = entry.UserId,
                    Nome = entry.Nome,
                    NomeUtilizador = entry.NomeUtilizador,
                    FotoPerfil = entry.FotoPerfil,
                    TotalSeguidores = entry.TotalSeguidores
                })
                .ToList(),
            TopUtilizadoresFimbu = topFimbu
                .Select(entry => new AdminTopFimbuUserDto
                {
                    Id = entry.UserId,
                    Nome = entry.Nome,
                    NomeUtilizador = entry.NomeUtilizador,
                    FotoPerfil = entry.FotoPerfil,
                    TotalInteracoes = entry.TotalInteracoes
                })
                .ToList()
        };
    }

    public async Task<IReadOnlyList<ReportedCommentDto>> GetReportedCommentsAsync()
    {
        var reports = await _contentReportRepository.GetByTargetTypeAsync("comment");
        var grouped = reports.GroupBy(report => report.TargetId);

        var result = new List<ReportedCommentDto>();
        foreach (var group in grouped)
        {
            var comment = await _commentRepository.GetByIdAsync(group.Key);
            if (comment == null)
            {
                // Report points to a comment that no longer exists: clean it up.
                await _contentReportRepository.DeleteByTargetAsync("comment", group.Key);
                continue;
            }

            var author = await _userRepository.GetByIdAsync(comment.UserId);
            var orderedReports = group.OrderByDescending(report => report.CreatedAt).ToList();

            result.Add(new ReportedCommentDto
            {
                Id = comment.Id,
                PostId = comment.PostId,
                AutorId = comment.UserId,
                AutorNome = author?.DisplayName ?? author?.UserName ?? "Utilizador",
                AutorNomeUtilizador = author?.UserName ?? string.Empty,
                AutorFoto = author?.ProfilePhoto,
                Texto = comment.Text,
                CriadoEm = comment.CreatedAt,
                AtualizadoEm = comment.UpdatedAt,
                ReportsCount = orderedReports.Count,
                Reports = orderedReports.Select(MapReportEntry).ToList()
            });
        }

        return result
            .OrderByDescending(item => item.ReportsCount)
            .ThenByDescending(item => item.CriadoEm)
            .ToList();
    }

    public async Task<IReadOnlyList<ReportedPublicationDto>> GetReportedPublicationsAsync()
    {
        var reports = await _contentReportRepository.GetByTargetTypeAsync("post");
        var grouped = reports.GroupBy(report => report.TargetId);

        var result = new List<ReportedPublicationDto>();
        foreach (var group in grouped)
        {
            var post = await _postRepository.GetByIdAsync(group.Key);
            if (post == null)
            {
                await _contentReportRepository.DeleteByTargetAsync("post", group.Key);
                continue;
            }

            var author = await _userRepository.GetByIdAsync(post.UserId);
            var orderedReports = group.OrderByDescending(report => report.CreatedAt).ToList();

            result.Add(new ReportedPublicationDto
            {
                Id = post.Id,
                DonoId = post.UserId,
                DonoNome = author?.DisplayName ?? author?.UserName ?? "Utilizador",
                DonoNomeUtilizador = author?.UserName ?? string.Empty,
                DonoFoto = author?.ProfilePhoto,
                Texto = post.Text,
                ImagemUrl = post.ImagePath,
                VideoUrl = post.VideoPath,
                CriadoEm = post.CreatedAt,
                AtualizadoEm = post.UpdatedAt,
                ReportsCount = orderedReports.Count,
                Reports = orderedReports.Select(MapReportEntry).ToList()
            });
        }

        return result
            .OrderByDescending(item => item.ReportsCount)
            .ThenByDescending(item => item.CriadoEm)
            .ToList();
    }

    public async Task RemoveCommentAsync(Guid commentId)
    {
        await _commentService.DeleteAsync(Guid.Empty, commentId, isAdmin: true);
        await _contentReportRepository.DeleteByTargetAsync("comment", commentId);
    }

    public async Task DismissCommentReportsAsync(Guid commentId)
    {
        await _contentReportRepository.DeleteByTargetAsync("comment", commentId);
    }

    public async Task RemovePublicationAsync(Guid postId)
    {
        await _postService.DeleteAsync(Guid.Empty, postId, isAdmin: true);
        await _contentReportRepository.DeleteByTargetAsync("post", postId);
    }

    public async Task DismissPublicationReportsAsync(Guid postId)
    {
        await _contentReportRepository.DeleteByTargetAsync("post", postId);
    }

    public async Task<IReadOnlyList<AdminUserDto>> GetUsersAsync()
    {
        var users = _userManager.Users.ToList();

        var result = new List<AdminUserDto>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var followersCount = await _followRepository.GetFollowersCountAsync(user.Id);
            var followingCount = await _followRepository.GetFollowingCountAsync(user.Id);
            var posts = await _postRepository.GetByUserIdAsync(user.Id);

            result.Add(new AdminUserDto
            {
                Id = user.Id,
                Username = user.UserName ?? string.Empty,
                DisplayName = user.DisplayName,
                Email = user.Email,
                ProfilePhotoUrl = user.ProfilePhoto,
                IsPrivate = user.IsPrivate,
                Role = roles.Contains(AdminRoleName) ? AdminRoleName : "User",
                FollowersCount = followersCount,
                FollowingCount = followingCount,
                PublicacoesCount = posts.Count(),
                CreatedAt = user.CreatedAt
            });
        }

        return result
            .OrderByDescending(user => user.CreatedAt)
            .ToList();
    }

    private async Task<AuthResponseDto> BuildAuthResponseAsync(User user)
    {
        var token = await _tokenService.GenerateTokenAsync(user);
        var userResponse = await _userService.GetUserResponseAsync(user.Id, user.Id);

        return new AuthResponseDto
        {
            Token = token,
            User = userResponse
        };
    }

    private static AdminReportEntryDto MapReportEntry(ContentReport report)
    {
        return new AdminReportEntryDto
        {
            ReporterId = report.ReporterId,
            ReporterNome = report.Reporter?.DisplayName ?? report.Reporter?.UserName ?? "Utilizador",
            ReporterNomeUtilizador = report.Reporter?.UserName ?? string.Empty,
            Motivo = report.Reason,
            Descricao = report.Details,
            CriadoEm = report.CreatedAt
        };
    }

    private string? ResolveAdminRegistrationCode()
    {
        var fromEnvironment = Environment.GetEnvironmentVariable("NZOLANET_ADMIN_CODE");
        if (!string.IsNullOrWhiteSpace(fromEnvironment))
        {
            return fromEnvironment;
        }

        return _configuration["AdminSettings:RegistrationCode"];
    }
}

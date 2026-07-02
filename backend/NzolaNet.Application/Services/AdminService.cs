using NzolaNet.Application.DTOs.Admin;
using NzolaNet.Application.DTOs.Auth;
using NzolaNet.Application.Interfaces;
using NzolaNet.Domain.Interfaces.Repositories;
using System.Linq;

namespace NzolaNet.Application.Services;

public class AdminService : IAdminService
{
    private readonly IAuthService _authService;
    private readonly IUserRepository _userRepository;
    private readonly ICommentService _commentService;
    private readonly IPostRepository _postRepository;
    private readonly ICommentRepository _commentRepository;
    private readonly ILikeRepository _likeRepository;
    private readonly IFollowRepository _followRepository;
    private readonly IContentReportRepository _contentReportRepository;
    private readonly IConversationRepository _conversationRepository;
    private readonly IUserPresenceService _presenceService;
    private readonly IAdminAnalyticsStore _adminAnalyticsStore;
    private readonly IAdminRealtimeNotifier _adminRealtimeNotifier;

    public AdminService(
        IAuthService authService,
        IUserRepository userRepository,
        ICommentService commentService,
        IPostRepository postRepository,
        ICommentRepository commentRepository,
        ILikeRepository likeRepository,
        IFollowRepository followRepository,
        IContentReportRepository contentReportRepository,
        IConversationRepository conversationRepository,
        IUserPresenceService presenceService,
        IAdminAnalyticsStore adminAnalyticsStore,
        IAdminRealtimeNotifier adminRealtimeNotifier)
    {
        _authService = authService;
        _userRepository = userRepository;
        _commentService = commentService;
        _postRepository = postRepository;
        _commentRepository = commentRepository;
        _likeRepository = likeRepository;
        _followRepository = followRepository;
        _contentReportRepository = contentReportRepository;
        _conversationRepository = conversationRepository;
        _presenceService = presenceService;
        _adminAnalyticsStore = adminAnalyticsStore;
        _adminRealtimeNotifier = adminRealtimeNotifier;
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

    public async Task<AuthResponseDto> RegisterAdminAsync(AdminRegisterDto registerDto)
    {
        if (await _userRepository.ExistsByEmailAsync(registerDto.Email))
        {
            throw new InvalidOperationException("Já existe um utilizador com este email.");
        }

        var configuredInviteCode = Environment.GetEnvironmentVariable("NZOLANET_ADMIN_INVITE_CODE");
        if (!string.IsNullOrWhiteSpace(configuredInviteCode))
        {
            var providedInviteCode = registerDto.InviteCode?.Trim();
            if (!string.Equals(providedInviteCode, configuredInviteCode, StringComparison.Ordinal))
            {
                throw new UnauthorizedAccessException("Código de convite de administrador inválido.");
            }
        }

        var normalizedUsername = await BuildUniqueAdminUsernameAsync(registerDto.Username, registerDto.Email);
        var now = DateTime.UtcNow;
        var adminUser = new Domain.Entities.User
        {
            UserName = normalizedUsername,
            Email = registerDto.Email.Trim(),
            DisplayName = registerDto.DisplayName.Trim(),
            EmailConfirmed = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        var created = await _userRepository.CreateAsync(adminUser, registerDto.Password);
        if (!created)
        {
            throw new InvalidOperationException("Não foi possível registar o administrador.");
        }

        await _userRepository.AddToRoleAsync(adminUser, "Admin");

        await _adminRealtimeNotifier.NotifyMetricsChangedAsync();

        return await LoginAsync(new AdminLoginDto
        {
            Email = adminUser.Email!,
            Password = registerDto.Password
        });
    }

    public async Task<AdminMetricsDto> GetMetricsAsync(string periodoRanking = "30d")
    {
        var desdeUtc = ResolverInicioPeriodoRanking(periodoRanking);
        var totalUsers = await _userRepository.GetTotalCountAsync();
        var onlineUsers = _presenceService.GetOnlineUsersCount();
        var offlineUsers = Math.Max(0, totalUsers - onlineUsers);
        var totalFimbuInteractions = _adminAnalyticsStore.GetSnapshot().TotalFimbuInteractions;
        _adminAnalyticsStore.RegisterMetricsSample(totalUsers, onlineUsers, totalFimbuInteractions);
        var analyticsSnapshot = _adminAnalyticsStore.GetSnapshot();
        var topHashtags = await _postRepository.GetTopUsedHashtagsAsync(10, desdeUtc);
        var topPerfisSeguidos = await _followRepository.GetTopFollowedProfilesAsync(10, desdeUtc);

        return new AdminMetricsDto
        {
            TotalUtilizadores = totalUsers,
            TotalUtilizadoresOnline = onlineUsers,
            TotalUtilizadoresOffline = offlineUsers,
            TotalPublicacoes = await _postRepository.GetTotalCountAsync(),
            TotalPublicacoesDenunciadas = await _contentReportRepository.GetTotalReportedPostsAsync(),
            TotalComentarios = await _commentRepository.GetTotalCountAsync(),
            TotalComentariosDenunciados = await _contentReportRepository.GetTotalReportedCommentsAsync(),
            TotalDenuncias = await _contentReportRepository.GetTotalReportsCountAsync(),
            TotalBazes = await _likeRepository.GetTotalCountAsync(),
            TotalGrupos = await _conversationRepository.GetTotalGroupsCountAsync(),
            TotalMensagensEnviadas = await _conversationRepository.GetTotalMessagesCountAsync(),
            TotalMensagensRecebidas = await _conversationRepository.GetTotalMessageDeliveriesCountAsync(),
            TotalGruposApagados = analyticsSnapshot.TotalDeletedGroups,
            TotalInteracoesIa = analyticsSnapshot.TotalFimbuInteractions,
            TotalMensagensIa = analyticsSnapshot.TotalFimbuMessages,
            MediaUtilizadoresOnlinePercentagem = analyticsSnapshot.AverageOnlinePercent,
            MediaUtilizadoresOfflinePercentagem = analyticsSnapshot.AverageOfflinePercent,
            MediaUsoIaPercentagem = analyticsSnapshot.AverageAiUsagePercent,
            TotalHashtagsCriadas = await _postRepository.GetTotalCreatedHashtagsAsync(desdeUtc),
            TopHashtagsMaisUsadas = topHashtags
                .Select(hashtag => new AdminTopHashtagDto
                {
                    Hashtag = hashtag.Hashtag,
                    Usos = hashtag.Usos
                })
                .ToList(),
            TopPerfisMaisSeguidos = topPerfisSeguidos
                .Select(profile => new AdminTopFollowedProfileDto
                {
                    UserId = profile.UserId,
                    Nome = profile.Nome,
                    NomeUtilizador = profile.NomeUtilizador,
                    FotoPerfil = profile.FotoPerfil,
                    TotalSeguidores = profile.TotalSeguidores
                })
                .ToList()
        };
    }

    private static DateTime ResolverInicioPeriodoRanking(string periodoRanking)
    {
        return periodoRanking.Trim().ToLowerInvariant() switch
        {
            "24h" => DateTime.UtcNow.AddHours(-24),
            "7d" => DateTime.UtcNow.AddDays(-7),
            _ => DateTime.UtcNow.AddDays(-30)
        };
    }

    public async Task<IEnumerable<AdminReportedCommentDto>> GetReportedCommentsAsync()
    {
        var reports = await _contentReportRepository.GetByTargetTypeAsync("comment");
        if (reports.Count == 0)
        {
            return Array.Empty<AdminReportedCommentDto>();
        }

        var grouped = reports
            .GroupBy(report => report.TargetId)
            .OrderByDescending(group => group.Count())
            .ToList();

        var comments = new List<AdminReportedCommentDto>(grouped.Count);

        foreach (var group in grouped)
        {
            var comment = await _commentRepository.GetByIdAsync(group.Key);
            if (comment == null)
            {
                continue;
            }

            var reportEntries = group
                .Select(report => new AdminReportEntryDto
                {
                    ReporterId = report.ReporterId,
                    ReporterNome = report.Reporter.DisplayName ?? report.Reporter.UserName ?? report.Reporter.Email ?? "Utilizador",
                    ReporterNomeUtilizador = report.Reporter.UserName ?? "utilizador",
                    Motivo = report.Reason,
                    Descricao = report.Details,
                    CriadoEm = report.CreatedAt
                })
                .OrderByDescending(item => item.CriadoEm)
                .ToList();

            comments.Add(new AdminReportedCommentDto
            {
                Id = comment.Id,
                PostId = comment.PostId,
                AutorId = comment.UserId,
                AutorNome = comment.User.DisplayName ?? comment.User.UserName ?? "Utilizador",
                AutorFoto = comment.User.ProfilePhoto,
                AutorNomeUtilizador = comment.User.UserName ?? "utilizador",
                Texto = comment.Text,
                CriadoEm = comment.CreatedAt,
                AtualizadoEm = comment.UpdatedAt,
                ReportsCount = reportEntries.Count,
                Reports = reportEntries
            });
        }

        return comments;
    }

    public async Task<IEnumerable<AdminReportedPublicationDto>> GetReportedPublicationsAsync()
    {
        var reports = await _contentReportRepository.GetByTargetTypeAsync("post");
        if (reports.Count == 0)
        {
            return Array.Empty<AdminReportedPublicationDto>();
        }

        var grouped = reports
            .GroupBy(report => report.TargetId)
            .OrderByDescending(group => group.Count())
            .ToList();

        var publications = new List<AdminReportedPublicationDto>(grouped.Count);

        foreach (var group in grouped)
        {
            var publication = await _postRepository.GetByIdAsync(group.Key);
            if (publication == null)
            {
                continue;
            }

            var reportEntries = group
                .Select(report => new AdminReportEntryDto
                {
                    ReporterId = report.ReporterId,
                    ReporterNome = report.Reporter.DisplayName ?? report.Reporter.UserName ?? report.Reporter.Email ?? "Utilizador",
                    ReporterNomeUtilizador = report.Reporter.UserName ?? "utilizador",
                    Motivo = report.Reason,
                    Descricao = report.Details,
                    CriadoEm = report.CreatedAt
                })
                .OrderByDescending(item => item.CriadoEm)
                .ToList();

            publications.Add(new AdminReportedPublicationDto
            {
                Id = publication.Id,
                DonoId = publication.UserId,
                DonoNome = publication.User.DisplayName ?? publication.User.UserName ?? "Utilizador",
                DonoNomeUtilizador = publication.User.UserName ?? "utilizador",
                DonoFoto = publication.User.ProfilePhoto,
                Texto = publication.Text,
                ImagemUrl = publication.ImagePath,
                VideoUrl = publication.VideoPath,
                CriadoEm = publication.CreatedAt,
                AtualizadoEm = publication.UpdatedAt,
                ReportsCount = reportEntries.Count,
                Reports = reportEntries
            });
        }

        return publications;
    }

    public async Task DeleteCommentAsync(Guid adminUserId, Guid commentId)
    {
        await _commentService.DeleteAsync(adminUserId, commentId, isAdmin: true);
        await _contentReportRepository.DeleteByTargetAsync("comment", commentId);
        await _adminRealtimeNotifier.NotifyMetricsChangedAsync();
        await _adminRealtimeNotifier.NotifyReportsChangedAsync();
    }

    public async Task DeletePublicationAsync(Guid adminUserId, Guid publicationId)
    {
        var publication = await _postRepository.GetByIdAsync(publicationId);
        if (publication == null)
        {
            throw new ArgumentException("Publicação não encontrada.");
        }

        var deleted = await _postRepository.DeleteAsync(publication);
        if (!deleted)
        {
            throw new InvalidOperationException("Não foi possível apagar a publicação.");
        }

        await _contentReportRepository.DeleteByTargetAsync("post", publicationId);
        await _adminRealtimeNotifier.NotifyMetricsChangedAsync();
        await _adminRealtimeNotifier.NotifyReportsChangedAsync();
    }

    public async Task DismissPublicationReportsAsync(Guid adminUserId, Guid publicationId)
    {
        var removed = await _contentReportRepository.DeleteByTargetAsync("post", publicationId);
        if (removed == 0)
        {
            throw new ArgumentException("Não existem denúncias pendentes para esta publicação.");
        }

        await _adminRealtimeNotifier.NotifyMetricsChangedAsync();
        await _adminRealtimeNotifier.NotifyReportsChangedAsync();
    }

    private async Task<string> BuildUniqueAdminUsernameAsync(string usernameInput, string emailInput)
    {
        var baseUsername = usernameInput.Trim();
        if (string.IsNullOrWhiteSpace(baseUsername))
        {
            baseUsername = emailInput.Split('@', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? "admin";
        }

        baseUsername = new string(baseUsername
            .Where(ch => char.IsLetterOrDigit(ch) || ch is '_' or '.' or '-')
            .ToArray())
            .Trim();

        if (string.IsNullOrWhiteSpace(baseUsername))
        {
            baseUsername = "admin";
        }

        var candidate = baseUsername;
        var suffix = 1;

        while (await _userRepository.ExistsByUsernameAsync(candidate))
        {
            candidate = $"{baseUsername}{suffix}";
            suffix++;
        }

        return candidate;
    }
}

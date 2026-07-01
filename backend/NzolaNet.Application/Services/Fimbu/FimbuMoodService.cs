using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Application.Services.Fimbu;

/// <summary>
/// Sorteia e mantém o traço dominante da Fimbu por utilizador até novo login.
/// </summary>
public sealed class FimbuMoodService : IFimbuMoodService
{
    private static readonly string[] Traits =
    [
        "irritada", "triste", "alegre", "séria", "brincalhona", "amuada",
        "preguiçosa", "proativa", "frontal", "malvada", "humilde", "fingida",
        "fofoqueira", "amigável", "verdadeira", "honesta", "espantada",
        "bandida", "irresponsável", "responsável", "fugitiva", "protetora",
        "golpista", "policial", "não enganadora", "burladora", "bajuladora",
        "justa", "injusta", "risonha", "extremamente inteligente",
        "extremamente burra", "sonhadora", "não sonhadora", "sofredora",
        "ganhadora", "amadora", "amante", "profissional", "phd",
        "business man", "poor man", "impaciente", "paciente", "chorona",
        "mimosa", "durona", "heroína", "medrosa", "medonha", "corajosa",
        "exemplar", "péssimo exemplo", "arrogante"
    ];

    private readonly ConcurrentDictionary<Guid, string> _sessionTraits = new();
    private readonly ILogger<FimbuMoodService> _logger;
    private readonly Random _random = new();

    public FimbuMoodService(ILogger<FimbuMoodService> logger)
    {
        _logger = logger;
    }

    public string GetOrAssignSessionTrait(Guid userId) =>
        _sessionTraits.GetOrAdd(userId, _ => DrawTrait());

    public string AssignSessionTrait(Guid userId)
    {
        var trait = DrawTrait();
        _sessionTraits[userId] = trait;
        _logger.LogInformation("Fimbu traço de sessão atribuído ao utilizador {UserId}: {Trait}", userId, trait);
        return trait;
    }

    public void ClearSessionTrait(Guid userId)
    {
        _sessionTraits.TryRemove(userId, out _);
    }

    private string DrawTrait() => Traits[_random.Next(Traits.Length)];
}

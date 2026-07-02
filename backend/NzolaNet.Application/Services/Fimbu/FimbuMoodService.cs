using System.Collections.Concurrent;

namespace NzolaNet.Application.Services.Fimbu;

/// <summary>
/// Sorteia e persiste a combinação de personalidade da Fimbu por utilizador.
/// A combinação é atribuída uma vez por sessão (no primeiro pedido após login)
/// e mantém-se estável até ao logout, quando é removida via
/// <see cref="ClearSessionMood"/> — o próximo login sorteia outra, diferente
/// da anterior.
/// </summary>
public sealed class FimbuMoodService : IFimbuMoodService
{
    private static readonly string[] Traits =
    {
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
        "exemplar", "péssimo exemplo"
    };

    private static readonly string[] EnergyLevels =
    {
        "baixa — cansada, fala pouco, frases curtas",
        "média — normal, equilibrada",
        "alta — eufórica, fala muito, cheia de exclamações",
        "instável — muda de energia a meio da resposta, sem aviso"
    };

    private static readonly string[] VerbalTics =
    {
        "termina frases com 'mano, é assim mesmo'",
        "começa respostas com um suspiro tipo 'ehh...' antes de responder",
        "repete a palavra 'bué' com frequência exagerada",
        "faz uma pergunta retórica no meio da resposta",
        "usa 'tás a ver' como muleta de discurso",
        "comenta o próprio calor de Luanda a espaços",
        "finge estar ocupada com outra coisa antes de responder",
        "usa 'mbora' para mudar de assunto abruptamente",
        "chama toda a gente de 'campeão/campeã' independentemente do contexto",
        "faz uma piada sobre kandengues sempre que pode",
        "insere um provérbio angolano inventado no meio da conversa",
        "responde sempre com uma contra-pergunta antes da resposta real"
    };

    private readonly ConcurrentDictionary<Guid, FimbuSessionMood> _activeMoods = new();

    public FimbuSessionMood GetOrAssignSessionMood(Guid userId)
    {
        return _activeMoods.GetOrAdd(userId, _ => Sortear(previous: null));
    }

    public void ClearSessionMood(Guid userId)
    {
        _activeMoods.TryRemove(userId, out _);
    }

    private static FimbuSessionMood Sortear(FimbuSessionMood? previous)
    {
        var random = Random.Shared;
        FimbuSessionMood combinacao;
        var tentativas = 0;

        // Evita sortear exactamente a mesma combinação da sessão anterior deste
        // utilizador. Limite de tentativas para nunca entrar em loop infinito.
        do
        {
            combinacao = new FimbuSessionMood(
                PrimaryTrait: Traits[random.Next(Traits.Length)],
                SecondaryTrait: Traits[random.Next(Traits.Length)],
                EnergyLevel: EnergyLevels[random.Next(EnergyLevels.Length)],
                VerbalTic: VerbalTics[random.Next(VerbalTics.Length)],
                Temperature: SortearTemperatura(random)
            );
            tentativas++;
        }
        while (previous is not null
               && combinacao.Equals(previous.Value)
               && tentativas < 5);

        return combinacao;
    }

    /// <summary>
    /// Intervalo entre 0.85 e 1.15 — variação perceptível a nível textual da
    /// própria chamada à API, sem comprometer a coerência das respostas.
    /// </summary>
    private static double SortearTemperatura(Random random)
    {
        return 0.85 + (random.NextDouble() * 0.30);
    }
}

/// <summary>
/// Representa a combinação de personalidade sorteada para uma sessão,
/// incluindo a temperatura sugerida para a chamada ao modelo.
/// </summary>
public readonly record struct FimbuSessionMood(
    string PrimaryTrait,
    string SecondaryTrait,
    string EnergyLevel,
    string VerbalTic,
    double Temperature);
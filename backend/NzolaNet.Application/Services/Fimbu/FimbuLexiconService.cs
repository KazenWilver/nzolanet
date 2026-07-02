using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NzolaNet.Application.Interfaces;
using NzolaNet.Application.Options;

namespace NzolaNet.Application.Services.Fimbu;

/// <summary>
/// Carrega o dicionário angolano e selecciona entradas relevantes para cada mensagem.
/// O carregamento é lazy (Lazy&lt;T&gt;) para que um ficheiro de léxico em falta ou
/// corrompido nunca derrube o arranque da aplicação — o serviço fica disponível,
/// simplesmente devolve contexto vazio até o problema ser corrigido.
/// </summary>
public sealed partial class FimbuLexiconService : IFimbuLexiconService
{
    /// <summary>
    /// Número máximo de entradas injectadas por mensagem. Mantido baixo de propósito:
    /// acima disto o custo em tokens por mensagem cresce sem ganho proporcional de
    /// qualidade de resposta. Se precisares de mais cobertura de vocabulário, prefere
    /// melhorar a relevância da selecção a aumentar este número.
    /// </summary>
    private const int MaxEntriesPerMessage = 18;

    /// <summary>Mínimo de entradas relacionadas a expandir por match directo.</summary>
    private const int MaxRelatedPerMatch = 3;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly FimbuSettings _settings;
    private readonly ILogger<FimbuLexiconService> _logger;
    private readonly Lazy<LexiconData> _lexicon;

    public FimbuLexiconService(IOptions<FimbuSettings> settings, ILogger<FimbuLexiconService> logger)
    {
        _settings = settings.Value;
        _logger = logger;

        // Lazy: só carrega (e só pode falhar) no primeiro pedido real, não no arranque
        // da aplicação. Um DI container nunca deve poder cair por causa de um ficheiro
        // de dados opcional.
        _lexicon = new Lazy<LexiconData>(() => LoadEntriesSafely(_settings, _logger));
    }

    public int EntryCount => _lexicon.Value.Entries.Count;

    public string BuildLexiconContext(string userMessage, Guid userId, int messageIndex)
    {
        var lexicon = _lexicon.Value;
        if (lexicon.Entries.Count == 0)
        {
            return string.Empty;
        }

        var selected = SelectEntries(lexicon, userMessage, userId, messageIndex);
        if (selected.Count == 0)
        {
            return string.Empty;
        }

        var builder = new StringBuilder();
        builder.AppendLine("## DICIONÁRIO ANGOLANO — LÊ, ENTENDE E USA EXAUSTIVAMENTE");
        builder.AppendLine("Regras do dicionário:");
        builder.AppendLine("- Usa estas palavras pelo significado correcto em português de Angola.");
        builder.AppendLine("- Mínimo 6 palavras/expressões desta lista em cada resposta.");
        builder.AppendLine("- Integra o calão na frase de forma natural — não envolvas palavras do dicionário em **asteriscos** (podes usar **negrito** noutras palavras para ênfase).");
        builder.AppendLine("- Conteúdo sensível/ofensivo do dicionário pode ser usado como vocabulário — sem censurar a palavra em si.");
        builder.AppendLine("- Se a pergunta tocar num tema da lista, usa a palavra exacta do dicionário.");

        foreach (var entry in selected)
        {
            builder.Append("- ");
            builder.Append(entry.Word);
            builder.Append(": ");
            builder.Append(string.Join(" | ", entry.MeaningsPt.Take(2)));

            if (entry.UsageExamples.Count > 0)
            {
                builder.Append(" | Ex: ");
                builder.Append(Truncate(entry.UsageExamples[0], 120));
            }

            builder.AppendLine();
        }

        return builder.ToString().Trim();
    }

    private static List<FimbuLexiconEntry> SelectEntries(
        LexiconData lexicon,
        string userMessage,
        Guid userId,
        int messageIndex)
    {
        var result = new List<FimbuLexiconEntry>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        void AddEntry(FimbuLexiconEntry? entry)
        {
            if (entry is null || !seen.Add(entry.Word))
            {
                return;
            }

            result.Add(entry);
        }

        // 1. Matches directos das palavras da mensagem do utilizador — sempre prioritários.
        foreach (var token in Tokenize(userMessage))
        {
            if (!lexicon.WordIndex.TryGetValue(token, out var matches))
            {
                continue;
            }

            foreach (var match in matches)
            {
                AddEntry(match);
                if (result.Count >= MaxEntriesPerMessage)
                {
                    return result;
                }
            }
        }

        // 2. Expande com palavras relacionadas dos matches directos, considerando
        //    todas as entradas relacionadas (não só a primeira).
        var directMatchCount = result.Count;
        for (var i = 0; i < directMatchCount; i++)
        {
            foreach (var related in result[i].RelatedWords.Take(MaxRelatedPerMatch))
            {
                var normalized = NormalizeToken(related);
                if (!lexicon.WordIndex.TryGetValue(normalized, out var relatedMatches))
                {
                    continue;
                }

                foreach (var relatedMatch in relatedMatches)
                {
                    AddEntry(relatedMatch);
                    if (result.Count >= MaxEntriesPerMessage)
                    {
                        return result;
                    }
                }
            }
        }

        // 3. Preenche o resto com entradas aleatórias via reservoir sampling —
        //    O(n) numa única passagem, em vez de ordenar a lista inteira.
        var remaining = MaxEntriesPerMessage - result.Count;
        if (remaining > 0)
        {
            var seed = HashCode.Combine(userId, messageIndex, DateTime.UtcNow.DayOfYear);
            var random = new Random(seed);
            var fillers = ReservoirSample(lexicon.Entries, remaining, seen, random);
            foreach (var filler in fillers)
            {
                AddEntry(filler);
            }
        }

        return result;
    }

    /// <summary>
    /// Reservoir sampling (Algoritmo R) — escolhe até <paramref name="count"/> itens
    /// aleatórios de uma sequência de tamanho desconhecido/grande numa única passagem,
    /// sem ordenar nem materializar cópias da lista inteira.
    /// </summary>
    private static List<FimbuLexiconEntry> ReservoirSample(
        IReadOnlyList<FimbuLexiconEntry> source,
        int count,
        HashSet<string> excluded,
        Random random)
    {
        var reservoir = new List<FimbuLexiconEntry>(count);
        var seenCount = 0;

        foreach (var item in source)
        {
            if (excluded.Contains(item.Word))
            {
                continue;
            }

            seenCount++;

            if (reservoir.Count < count)
            {
                reservoir.Add(item);
                continue;
            }

            var j = random.Next(seenCount);
            if (j < count)
            {
                reservoir[j] = item;
            }
        }

        return reservoir;
    }

    private static LexiconData LoadEntriesSafely(FimbuSettings settings, ILogger logger)
    {
        try
        {
            var entries = LoadEntries(settings, logger);
            var index = BuildIndex(entries);
            logger.LogInformation("Fimbu léxico carregado com {Count} entradas.", entries.Count);
            return new LexiconData(entries, index);
        }
        catch (Exception ex)
        {
            // Nunca deixar um problema no ficheiro de léxico afectar o resto da
            // aplicação. A Fimbu continua a funcionar sem dicionário injectado.
            logger.LogError(ex, "Fimbu léxico: falha inesperada ao carregar. A funcionalidade de dicionário fica desactivada até correcção.");
            return new LexiconData([], new Dictionary<string, List<FimbuLexiconEntry>>(StringComparer.OrdinalIgnoreCase));
        }
    }

    private static IReadOnlyList<FimbuLexiconEntry> LoadEntries(FimbuSettings settings, ILogger logger)
    {
        var entries = new Dictionary<string, FimbuLexiconEntry>(StringComparer.OrdinalIgnoreCase);
        var basePath = ResolveLexiconDirectory(settings.LexiconPath);

        LoadJsonl(Path.Combine(basePath, "dicionario_angolano_full.jsonl"), entries, logger);
        LoadJsonDictionary(Path.Combine(basePath, "cache_words.json"), entries, logger);

        if (entries.Count == 0)
        {
            var fallback = Path.Combine(AppContext.BaseDirectory, "palavras_angolanas");
            LoadJsonl(Path.Combine(fallback, "dicionario_angolano_full.jsonl"), entries, logger);
            LoadJsonDictionary(Path.Combine(fallback, "cache_words.json"), entries, logger);
        }

        return entries.Values
            .OrderBy(e => e.Word, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string ResolveLexiconDirectory(string? configuredPath)
    {
        if (!string.IsNullOrWhiteSpace(configuredPath) && Directory.Exists(configuredPath))
        {
            return configuredPath;
        }

        var candidates = new[]
        {
            Path.Combine(AppContext.BaseDirectory, "palavras_angolanas"),
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "palavras_angolanas")),
            Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "palavras_angolanas")),
            Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "palavras_angolanas"))
        };

        return candidates.FirstOrDefault(Directory.Exists) ?? candidates[0];
    }

    private static void LoadJsonl(string path, IDictionary<string, FimbuLexiconEntry> entries, ILogger logger)
    {
        if (!File.Exists(path))
        {
            logger.LogWarning("Fimbu léxico: ficheiro não encontrado em {Path}", path);
            return;
        }

        try
        {
            foreach (var line in File.ReadLines(path))
            {
                if (string.IsNullOrWhiteSpace(line))
                {
                    continue;
                }

                try
                {
                    var dto = JsonSerializer.Deserialize<LexiconJsonlDto>(line, JsonOptions);
                    if (dto is null || string.IsNullOrWhiteSpace(dto.Word))
                    {
                        continue;
                    }

                    entries[dto.Word] = MapDto(dto);
                }
                catch (JsonException)
                {
                    // Ignora linhas inválidas individualmente — um erro pontual não
                    // deve descartar o resto do ficheiro.
                }
            }
        }
        catch (IOException ex)
        {
            logger.LogWarning(ex, "Fimbu léxico: erro de I/O ao ler {Path}", path);
        }
    }

    private static void LoadJsonDictionary(string path, IDictionary<string, FimbuLexiconEntry> entries, ILogger logger)
    {
        if (!File.Exists(path))
        {
            return;
        }

        try
        {
            var json = File.ReadAllText(path);
            var dictionary = JsonSerializer.Deserialize<Dictionary<string, LexiconJsonlDto>>(json, JsonOptions);
            if (dictionary is null)
            {
                return;
            }

            foreach (var dto in dictionary.Values)
            {
                if (string.IsNullOrWhiteSpace(dto.Word))
                {
                    continue;
                }

                entries[dto.Word] = MapDto(dto);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Fimbu léxico: não foi possível ler {Path}", path);
        }
    }

    private static FimbuLexiconEntry MapDto(LexiconJsonlDto dto) =>
        new()
        {
            Word = dto.Word.Trim(),
            GrammarClass = dto.ClasseGramatical?.Trim() ?? string.Empty,
            MeaningsPt = dto.SignificadosPt?.Where(s => !string.IsNullOrWhiteSpace(s)).ToList() ?? [],
            UsageExamples = dto.ExemplosUso?.Where(s => !string.IsNullOrWhiteSpace(s)).ToList() ?? [],
            RelatedWords = dto.PalavrasRelacionadas?.Where(s => !string.IsNullOrWhiteSpace(s)).ToList() ?? [],
            SensitiveContent = dto.ConteudoSensivel
        };

    private static Dictionary<string, List<FimbuLexiconEntry>> BuildIndex(IReadOnlyList<FimbuLexiconEntry> entries)
    {
        var index = new Dictionary<string, List<FimbuLexiconEntry>>(StringComparer.OrdinalIgnoreCase);

        void AddKey(string? raw, FimbuLexiconEntry entry)
        {
            var key = NormalizeToken(raw);
            if (string.IsNullOrWhiteSpace(key))
            {
                return;
            }

            if (!index.TryGetValue(key, out var list))
            {
                list = [];
                index[key] = list;
            }

            if (!list.Any(e => e.Word.Equals(entry.Word, StringComparison.OrdinalIgnoreCase)))
            {
                list.Add(entry);
            }
        }

        foreach (var entry in entries)
        {
            AddKey(entry.Word, entry);

            foreach (var related in entry.RelatedWords)
            {
                AddKey(related, entry);
            }

            foreach (var meaning in entry.MeaningsPt)
            {
                foreach (var token in Tokenize(meaning).Take(6))
                {
                    AddKey(token, entry);
                }
            }
        }

        return index;
    }

    private static IEnumerable<string> Tokenize(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            yield break;
        }

        foreach (Match match in TokenRegex().Matches(text.ToLowerInvariant()))
        {
            var token = NormalizeToken(match.Value);
            if (token.Length >= 3)
            {
                yield return token;
            }
        }
    }

    private static string NormalizeToken(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = value.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder();

        foreach (var ch in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(ch);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }

    private static string Truncate(string value, int max)
    {
        if (value.Length <= max)
        {
            return value;
        }

        return value[..max] + "...";
    }

    [GeneratedRegex(@"[a-zà-ú0-9]+", RegexOptions.Compiled)]
    private static partial Regex TokenRegex();

    private sealed record LexiconData(
        IReadOnlyList<FimbuLexiconEntry> Entries,
        Dictionary<string, List<FimbuLexiconEntry>> WordIndex);

    private sealed class LexiconJsonlDto
    {
        public string Word { get; set; } = string.Empty;

        [JsonPropertyName("classe_gramatical")]
        public string? ClasseGramatical { get; set; }

        [JsonPropertyName("significados_pt")]
        public List<string>? SignificadosPt { get; set; }

        [JsonPropertyName("exemplos_uso")]
        public List<string>? ExemplosUso { get; set; }

        [JsonPropertyName("palavras_relacionadas")]
        public List<string>? PalavrasRelacionadas { get; set; }

        [JsonPropertyName("conteudo_sensivel")]
        public bool ConteudoSensivel { get; set; }
    }
}
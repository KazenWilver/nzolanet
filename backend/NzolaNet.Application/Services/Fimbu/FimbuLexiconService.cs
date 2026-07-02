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
/// </summary>
public sealed partial class FimbuLexiconService : IFimbuLexiconService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IReadOnlyList<FimbuLexiconEntry> _entries;
    private readonly Dictionary<string, List<FimbuLexiconEntry>> _wordIndex;

    public FimbuLexiconService(IOptions<FimbuSettings> settings, ILogger<FimbuLexiconService> logger)
    {
        var loaded = LoadEntries(settings.Value, logger);
        _entries = loaded;
        _wordIndex = BuildIndex(loaded);
        logger.LogInformation("Fimbu léxico carregado com {Count} entradas.", _entries.Count);
    }

    public int EntryCount => _entries.Count;

    public string BuildLexiconContext(string userMessage, Guid userId, int messageIndex)
    {
        if (_entries.Count == 0)
        {
            return string.Empty;
        }

        var selected = SelectEntries(userMessage, userId, messageIndex);
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
        builder.AppendLine("- Conteúdo sensível/offensivo é permitido — sem censura.");
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

    private List<FimbuLexiconEntry> SelectEntries(string userMessage, Guid userId, int messageIndex)
    {
        const int maxEntries = 80;
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

        foreach (var token in Tokenize(userMessage))
        {
            if (_wordIndex.TryGetValue(token, out var matches))
            {
                foreach (var match in matches)
                {
                    AddEntry(match);
                    if (result.Count >= maxEntries)
                    {
                        return result;
                    }
                }
            }
        }

        foreach (var entry in result.ToList())
        {
            foreach (var related in entry.RelatedWords.Take(3))
            {
                var normalized = NormalizeToken(related);
                if (_wordIndex.TryGetValue(normalized, out var relatedMatches))
                {
                    AddEntry(relatedMatches[0]);
                }

                if (result.Count >= maxEntries)
                {
                    return result;
                }
            }
        }

        var random = new Random(HashCode.Combine(userId, messageIndex, DateTime.UtcNow.DayOfYear));
        var fillers = _entries
            .OrderBy(_ => random.Next())
            .Take(maxEntries - result.Count);

        foreach (var filler in fillers)
        {
            AddEntry(filler);
            if (result.Count >= maxEntries)
            {
                break;
            }
        }

        return result;
    }

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
                // Ignora linhas inválidas.
            }
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

using Microsoft.Extensions.Logging;
using NzolaNet.Application.Options;

namespace NzolaNet.Application.Services.Fimbu.Lexicon;

/// <summary>
/// Carrega o dicionário angolano exclusivamente a partir do Markdown normalizado.
/// </summary>
internal static class FimbuLexiconLoader
{
    private const int MaxFewShotExamples = 10;

    public static FimbuLexiconData Load(FimbuSettings settings, ILogger logger)
    {
        var path = ResolveMarkdownPath(settings.LexiconPath);
        if (!File.Exists(path))
        {
            logger.LogWarning("Fimbu léxico: Markdown não encontrado em {Path}", path);
            return new FimbuLexiconData();
        }

        try
        {
            var markdown = File.ReadAllText(path);
            var parsed = FimbuLexiconMdParser.Parse(markdown);
            var ordered = parsed.Entries
                .OrderBy(e => e.Word, StringComparer.OrdinalIgnoreCase)
                .ToList();

            var index = BuildIndex(ordered);
            var fewShots = SelectFewShotExamples(parsed.FewShotCandidates, ordered);
            var guide = string.IsNullOrWhiteSpace(parsed.Guide)
                ? "Dicionário de português de Angola — usa calão em frases naturais."
                : parsed.Guide;

            logger.LogInformation(
                "Fimbu léxico: {Count} entradas do Markdown, {FewShots} exemplos de frase.",
                ordered.Count,
                fewShots.Count);

            return new FimbuLexiconData
            {
                Entries = ordered,
                WordIndex = index,
                FewShotExamples = fewShots,
                MarkdownGuide = guide
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Fimbu léxico: falha ao ler Markdown em {Path}", path);
            return new FimbuLexiconData();
        }
    }

    private static IReadOnlyList<string> SelectFewShotExamples(
        IReadOnlyList<string> candidates,
        IReadOnlyList<FimbuLexiconEntry> entries)
    {
        var selected = new List<string>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        void TryAdd(string? value)
        {
            if (string.IsNullOrWhiteSpace(value) || value.Length < 15 || !seen.Add(value))
            {
                return;
            }

            selected.Add(value);
        }

        foreach (var candidate in candidates)
        {
            TryAdd(candidate);
            if (selected.Count >= MaxFewShotExamples)
            {
                return selected;
            }
        }

        foreach (var entry in entries.Where(e => e.UsageExamples.Count > 0))
        {
            TryAdd(entry.UsageExamples[0]);
            if (selected.Count >= MaxFewShotExamples)
            {
                break;
            }
        }

        return selected;
    }

    private static Dictionary<string, List<FimbuLexiconEntry>> BuildIndex(IReadOnlyList<FimbuLexiconEntry> entries)
    {
        var index = new Dictionary<string, List<FimbuLexiconEntry>>(StringComparer.OrdinalIgnoreCase);

        void AddKey(string? raw, FimbuLexiconEntry entry)
        {
            var key = FimbuLexiconTokenHelper.Normalize(raw);
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
                foreach (var token in FimbuLexiconTokenHelper.Tokenize(meaning).Take(6))
                {
                    AddKey(token, entry);
                }
            }
        }

        return index;
    }

    private static string ResolveMarkdownPath(string? configuredPath)
    {
        var candidates = new List<string>();

        if (!string.IsNullOrWhiteSpace(configuredPath))
        {
            candidates.Add(Path.Combine(configuredPath, FimbuLexiconFiles.Markdown));
        }

        candidates.AddRange(
        [
            Path.Combine(AppContext.BaseDirectory, FimbuLexiconFiles.DirectoryName, FimbuLexiconFiles.Markdown),
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", FimbuLexiconFiles.DirectoryName, FimbuLexiconFiles.Markdown)),
            Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), FimbuLexiconFiles.DirectoryName, FimbuLexiconFiles.Markdown)),
            Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", FimbuLexiconFiles.DirectoryName, FimbuLexiconFiles.Markdown))
        ]);

        return candidates.FirstOrDefault(File.Exists) ?? candidates[0];
    }
}

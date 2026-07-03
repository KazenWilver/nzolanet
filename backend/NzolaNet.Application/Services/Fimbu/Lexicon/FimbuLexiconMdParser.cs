using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using NzolaNet.Application.Services.Fimbu;

namespace NzolaNet.Application.Services.Fimbu.Lexicon;

/// <summary>
/// Lê e escreve o dicionário angolano em Markdown com formato normalizado.
/// </summary>
public static partial class FimbuLexiconMdParser
{
    private const string GuideSection = """
        ## Guia de uso (Fimbu)

        - Cada entrada inclui classe gramatical, significado e exemplo quando existir.
        - Usa o calão em frases completas — como se falasses no WhatsApp em Luanda.
        - Lê o significado antes de usar a palavra; respeita o contexto.
        - Palavras relacionadas ajudam a variar o vocabulário no mesmo tema.
        """;

    public static FimbuLexiconParseResult Parse(string markdown)
    {
        var lines = markdown.Replace("\r\n", "\n").Split('\n');
        var entries = new Dictionary<string, FimbuLexiconEntry>(StringComparer.OrdinalIgnoreCase);
        var fewShotCandidates = new List<string>();
        var guide = ExtractGuide(lines);

        var i = 0;
        while (i < lines.Length)
        {
            var line = lines[i].Trim();

            if (line.StartsWith("### ", StringComparison.Ordinal))
            {
                var entry = ParseEntry(lines, ref i);
                if (!string.IsNullOrWhiteSpace(entry.Word))
                {
                    entries[entry.Word] = entry;
                    if (entry.UsageExamples.Count > 0)
                    {
                        fewShotCandidates.Add(entry.UsageExamples[0]);
                    }
                }

                continue;
            }

            i++;
        }

        return new FimbuLexiconParseResult(entries.Values.ToList(), guide, fewShotCandidates);
    }

    public static string Write(IReadOnlyList<FimbuLexiconEntry> entries)
    {
        var builder = new StringBuilder();
        builder.AppendLine("# Dicionário de Português de Angola");
        builder.AppendLine();
        builder.AppendLine("> Fonte: [dicionarioangolano.com](https://dicionarioangolano.com/words) — uso educativo na Fimbu (NzolaNet)");
        builder.AppendLine($"> Total de entradas: {entries.Count}");
        builder.AppendLine();
        builder.AppendLine(GuideSection);
        builder.AppendLine();

        var grouped = entries
            .OrderBy(e => e.Word, StringComparer.OrdinalIgnoreCase)
            .GroupBy(e => GetSectionLetter(e.Word))
            .OrderBy(g => g.Key, StringComparer.OrdinalIgnoreCase);

        foreach (var group in grouped)
        {
            builder.AppendLine($"## {group.Key}");
            builder.AppendLine();

            foreach (var entry in group)
            {
                WriteEntry(builder, entry);
            }
        }

        return builder.ToString().TrimEnd() + Environment.NewLine;
    }

    private static void WriteEntry(StringBuilder builder, FimbuLexiconEntry entry)
    {
        builder.AppendLine($"### {entry.Word}");
        builder.AppendLine();

        if (!string.IsNullOrWhiteSpace(entry.GrammarClass))
        {
            builder.Append("- **Classe:** ");
            builder.AppendLine(CleanGrammarClass(entry.GrammarClass));
        }

        if (entry.MeaningsPt.Count > 0)
        {
            builder.Append("- **Significado:** ");
            builder.AppendLine(CleanMeaning(entry.MeaningsPt[0]));
        }

        if (entry.UsageExamples.Count > 0)
        {
            builder.Append("- **Exemplo:** ");
            builder.AppendLine(CleanExample(entry.UsageExamples[0]));
        }

        if (entry.RelatedWords.Count > 0)
        {
            builder.Append("- **Relacionadas:** ");
            builder.AppendLine(string.Join(", ", entry.RelatedWords));
        }

        builder.Append("- **Sensível:** ");
        builder.AppendLine(entry.SensitiveContent ? "sim" : "não");
        builder.AppendLine();
        builder.AppendLine("---");
        builder.AppendLine();
    }

    private static FimbuLexiconEntry ParseEntry(string[] lines, ref int index)
    {
        var word = lines[index].Trim()["### ".Length..].Trim();
        index++;

        var grammarClass = string.Empty;
        var meanings = new List<string>();
        var examples = new List<string>();
        var related = new List<string>();
        var sensitive = false;
        var collectingMeaning = false;
        var collectingExample = false;

        while (index < lines.Length)
        {
            var raw = lines[index];
            var line = raw.Trim();

            if (line.StartsWith("### ", StringComparison.Ordinal))
            {
                break;
            }

            if (line.StartsWith("## ", StringComparison.Ordinal))
            {
                break;
            }

            if (line.Contains("Conteúdo sensível", StringComparison.OrdinalIgnoreCase)
                || line.Equals("- **Sensível:** sim", StringComparison.OrdinalIgnoreCase))
            {
                sensitive = true;
                index++;
                continue;
            }

            if (line.StartsWith("- **Sensível:**", StringComparison.OrdinalIgnoreCase))
            {
                sensitive = line.Contains("sim", StringComparison.OrdinalIgnoreCase);
                index++;
                continue;
            }

            if (TryReadField(line, "Classe", out var classe))
            {
                grammarClass = classe;
                index++;
                continue;
            }

            if (TryReadField(line, "Significado", out var significado))
            {
                meanings.Add(significado);
                index++;
                continue;
            }

            if (TryReadField(line, "Exemplo", out var exemplo))
            {
                examples.Add(exemplo);
                index++;
                continue;
            }

            if (TryReadField(line, "Relacionadas", out var relacionadas))
            {
                related.AddRange(SplitRelated(relacionadas));
                index++;
                continue;
            }

            if (line.StartsWith("**Significados:**", StringComparison.OrdinalIgnoreCase))
            {
                collectingMeaning = true;
                collectingExample = false;
                index++;
                continue;
            }

            if (line.StartsWith("**Exemplo de uso:**", StringComparison.OrdinalIgnoreCase))
            {
                collectingMeaning = false;
                collectingExample = true;
                index++;
                continue;
            }

            if (line.StartsWith("**Palavras relacionadas:**", StringComparison.OrdinalIgnoreCase))
            {
                related.AddRange(SplitRelated(line["**Palavras relacionadas:**".Length..].Trim()));
                collectingMeaning = false;
                collectingExample = false;
                index++;
                continue;
            }

            if (line.StartsWith("**English meanings:**", StringComparison.OrdinalIgnoreCase))
            {
                collectingMeaning = false;
                collectingExample = false;
                index++;
                continue;
            }

            if (line.StartsWith("---", StringComparison.Ordinal))
            {
                index++;
                break;
            }

            if (collectingMeaning && NumberedLineRegex().IsMatch(line))
            {
                meanings.Add(CleanMeaning(NumberedLineRegex().Replace(line, string.Empty).Trim()));
            }
            else if (collectingExample && line.StartsWith('>'))
            {
                examples.Add(CleanExample(line.TrimStart('>', ' ').Trim()));
            }
            else if (line.StartsWith('*') && line.Contains("**", StringComparison.Ordinal) && string.IsNullOrWhiteSpace(grammarClass))
            {
                grammarClass = ExtractLegacyGrammarClass(line);
            }

            index++;
        }

        return new FimbuLexiconEntry
        {
            Word = word,
            GrammarClass = grammarClass,
            MeaningsPt = meanings,
            UsageExamples = examples,
            RelatedWords = related,
            SensitiveContent = sensitive
        };
    }

    private static string ExtractGuide(string[] lines)
    {
        var builder = new StringBuilder();
        var inGuide = false;

        foreach (var raw in lines)
        {
            var line = raw.Trim();

            if (line.StartsWith("## Guia de uso", StringComparison.OrdinalIgnoreCase))
            {
                inGuide = true;
                builder.AppendLine(line);
                continue;
            }

            if (inGuide)
            {
                if (line.StartsWith("## ", StringComparison.Ordinal) && !line.StartsWith("## Guia", StringComparison.OrdinalIgnoreCase))
                {
                    break;
                }

                builder.AppendLine(raw);
            }
        }

        return builder.ToString().Trim();
    }

    private static bool TryReadField(string line, string field, out string value)
    {
        var prefix = $"- **{field}:**";
        if (!line.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            value = string.Empty;
            return false;
        }

        value = line[prefix.Length..].Trim();
        return true;
    }

    private static IEnumerable<string> SplitRelated(string value)
    {
        if (string.IsNullOrWhiteSpace(value) || value == "—" || value == "-")
        {
            yield break;
        }

        foreach (var part in value.Split([',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (!string.IsNullOrWhiteSpace(part))
            {
                yield return part;
            }
        }
    }

    private static string ExtractLegacyGrammarClass(string line)
    {
        var match = LegacyGrammarRegex().Match(line);
        return match.Success ? CleanGrammarClass(match.Groups[1].Value) : string.Empty;
    }

    private static string CleanGrammarClass(string value)
    {
        var cleaned = value.Trim();
        var firstSpace = cleaned.IndexOf(' ');
        if (firstSpace > 0 && cleaned.Length > firstSpace + 10)
        {
            cleaned = cleaned[..firstSpace];
        }

        return cleaned;
    }

    private static string CleanMeaning(string value)
    {
        return NumberedLineRegex().Replace(value, string.Empty).Trim().TrimEnd('.');
    }

    private static string CleanExample(string value)
    {
        var cleaned = value.Trim();
        var translationIndex = cleaned.IndexOf("🌍", StringComparison.Ordinal);
        if (translationIndex > 0)
        {
            cleaned = cleaned[..translationIndex].Trim();
        }

        return cleaned.TrimEnd('.');
    }

    private static string GetSectionLetter(string word)
    {
        if (string.IsNullOrWhiteSpace(word))
        {
            return "#";
        }

        var first = char.ToUpper(word[0], CultureInfo.GetCultureInfo("pt-PT"));
        return char.IsLetter(first) ? first.ToString() : "#";
    }

    [GeneratedRegex(@"^\d+\s*\.\s*")]
    private static partial Regex NumberedLineRegex();

    [GeneratedRegex(@"\*\*([^*]+)\*\*")]
    private static partial Regex LegacyGrammarRegex();
}

public sealed class FimbuLexiconParseResult
{
    public FimbuLexiconParseResult(
        IReadOnlyList<FimbuLexiconEntry> entries,
        string guide,
        IReadOnlyList<string> fewShotCandidates)
    {
        Entries = entries;
        Guide = guide;
        FewShotCandidates = fewShotCandidates;
    }

    public IReadOnlyList<FimbuLexiconEntry> Entries { get; }

    public string Guide { get; }

    public IReadOnlyList<string> FewShotCandidates { get; }
}

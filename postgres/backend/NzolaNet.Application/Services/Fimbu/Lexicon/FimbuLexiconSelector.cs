using System.Globalization;
using System.Text.RegularExpressions;

namespace NzolaNet.Application.Services.Fimbu.Lexicon;

/// <summary>
/// Selecciona entradas relevantes do léxico para cada mensagem do utilizador.
/// </summary>
internal static partial class FimbuLexiconSelector
{
    private const int MaxEntriesPerMessage = 8;
    private const int MaxRelatedPerMatch = 3;

    public static IReadOnlyList<FimbuLexiconEntry> Select(
        FimbuLexiconData lexicon,
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

        foreach (var token in FimbuLexiconTokenHelper.Tokenize(userMessage))
        {
            if (!lexicon.WordIndex.TryGetValue(token, out var matches))
            {
                continue;
            }

            foreach (var match in matches.OrderByDescending(m => m.UsageExamples.Count))
            {
                AddEntry(match);
                if (result.Count >= MaxEntriesPerMessage)
                {
                    return result;
                }
            }
        }

        var directMatchCount = result.Count;
        for (var i = 0; i < directMatchCount; i++)
        {
            foreach (var related in result[i].RelatedWords.Take(MaxRelatedPerMatch))
            {
                var normalized = FimbuLexiconTokenHelper.Normalize(related);
                if (!lexicon.WordIndex.TryGetValue(normalized, out var relatedMatches))
                {
                    continue;
                }

                foreach (var relatedMatch in relatedMatches.OrderByDescending(m => m.UsageExamples.Count))
                {
                    AddEntry(relatedMatch);
                    if (result.Count >= MaxEntriesPerMessage)
                    {
                        return result;
                    }
                }
            }
        }

        return result;
    }
}

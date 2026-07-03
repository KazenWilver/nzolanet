using System.Globalization;
using System.Text.RegularExpressions;

namespace NzolaNet.Application.Services.Fimbu.Lexicon;

/// <summary>
/// Selecciona entradas relevantes do léxico para cada mensagem do utilizador.
/// </summary>
internal static partial class FimbuLexiconSelector
{
    private const int MaxEntriesPerMessage = 20;
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

        var remaining = MaxEntriesPerMessage - result.Count;
        if (remaining > 0)
        {
            var seed = HashCode.Combine(userId, messageIndex, DateTime.UtcNow.DayOfYear);
            var random = new Random(seed);
            var fillers = ReservoirSample(
                lexicon.Entries.Where(e => e.UsageExamples.Count > 0).ToList(),
                remaining,
                seen,
                random);

            if (fillers.Count < remaining)
            {
                fillers.AddRange(ReservoirSample(lexicon.Entries, remaining - fillers.Count, seen, random));
            }

            foreach (var filler in fillers)
            {
                AddEntry(filler);
            }
        }

        return result;
    }

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
}

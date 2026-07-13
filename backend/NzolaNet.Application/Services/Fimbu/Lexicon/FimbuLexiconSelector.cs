namespace NzolaNet.Application.Services.Fimbu.Lexicon;

/// <summary>
/// Selecciona 5–8 entradas relevantes por turno (extras/lexicon_index.py).
/// Só preenche com termos genéricos quando não há nenhum match — evita salada.
/// </summary>
internal static partial class FimbuLexiconSelector
{
    private const int MaxEntriesPerMessage = 8;
    private const int SoftFillWhenEmpty = 5;
    private const int MaxRelatedPerMatch = 2;

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

        // Só preenche se não houve match — senão o modelo força gíria irrelevante.
        if (result.Count == 0)
        {
            FillWithStableRandom(lexicon, userId, messageIndex, result, seen);
        }

        return result;
    }

    private static void FillWithStableRandom(
        FimbuLexiconData lexicon,
        Guid userId,
        int messageIndex,
        List<FimbuLexiconEntry> result,
        HashSet<string> seen)
    {
        if (lexicon.Entries.Count == 0)
        {
            return;
        }

        var pool = lexicon.Entries
            .Where(entry => !entry.SensitiveContent && entry.UsageExamples.Count > 0)
            .ToList();

        if (pool.Count == 0)
        {
            pool = lexicon.Entries.Where(entry => !entry.SensitiveContent).ToList();
        }

        if (pool.Count == 0)
        {
            return;
        }

        var seed = HashCode.Combine(userId, messageIndex, 0xF1B00);
        var random = new Random(seed);
        var order = Enumerable.Range(0, pool.Count).OrderBy(_ => random.Next()).ToList();

        foreach (var index in order)
        {
            if (!seen.Add(pool[index].Word))
            {
                continue;
            }

            result.Add(pool[index]);
            if (result.Count >= SoftFillWhenEmpty)
            {
                return;
            }
        }
    }
}

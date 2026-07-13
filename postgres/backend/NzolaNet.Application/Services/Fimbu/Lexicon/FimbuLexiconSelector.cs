namespace NzolaNet.Application.Services.Fimbu.Lexicon;

/// <summary>
/// Selecciona entradas relevantes do léxico para cada mensagem do utilizador.
/// Se houver poucos matches, completa com entradas aleatórias estáveis para a Fimbu
/// manter calão angolano mesmo em conversas genéricas.
/// </summary>
internal static partial class FimbuLexiconSelector
{
    private const int MaxEntriesPerMessage = 12;
    private const int MinEntriesPerMessage = 8;
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

        FillWithStableRandom(lexicon, userId, messageIndex, result, seen);
        return result;
    }

    /// <summary>
    /// Completa a lista com entradas não sensíveis, estáveis por utilizador e índice
    /// da mensagem, para a Fimbu nunca ficar sem calão para usar.
    /// </summary>
    private static void FillWithStableRandom(
        FimbuLexiconData lexicon,
        Guid userId,
        int messageIndex,
        List<FimbuLexiconEntry> result,
        HashSet<string> seen)
    {
        if (result.Count >= MinEntriesPerMessage || lexicon.Entries.Count == 0)
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
            AddSeen(pool[index], result, seen);
            if (result.Count >= MinEntriesPerMessage)
            {
                return;
            }
        }
    }

    private static void AddSeen(
        FimbuLexiconEntry entry,
        List<FimbuLexiconEntry> result,
        HashSet<string> seen)
    {
        if (!seen.Add(entry.Word))
        {
            return;
        }

        result.Add(entry);
    }
}

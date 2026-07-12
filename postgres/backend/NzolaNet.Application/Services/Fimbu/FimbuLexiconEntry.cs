namespace NzolaNet.Application.Services.Fimbu;

/// <summary>
/// Entrada do dicionário angolano usada pela Fimbu.
/// </summary>
public sealed record FimbuLexiconEntry
{
    public string Word { get; init; } = string.Empty;

    public string GrammarClass { get; init; } = string.Empty;

    public IReadOnlyList<string> MeaningsPt { get; init; } = [];

    public IReadOnlyList<string> UsageExamples { get; init; } = [];

    public IReadOnlyList<string> RelatedWords { get; init; } = [];

    public bool SensitiveContent { get; init; }

    /// <summary>
    /// Formata a entrada para injectar no prompt com contexto suficiente para uso correcto.
    /// </summary>
    public string FormatForPrompt()
    {
        var builder = new System.Text.StringBuilder();
        builder.Append("• ");
        builder.Append(Word);

        if (!string.IsNullOrWhiteSpace(GrammarClass))
        {
            builder.Append(" [");
            builder.Append(Truncate(GrammarClass, 60));
            builder.Append(']');
        }

        if (MeaningsPt.Count > 0)
        {
            builder.Append(" — ");
            builder.Append(string.Join(" | ", MeaningsPt.Take(2).Select(m => Truncate(m, 100))));
        }

        if (UsageExamples.Count > 0)
        {
            builder.Append(" | Frase: «");
            builder.Append(Truncate(UsageExamples[0], 140));
            builder.Append('»');
        }

        if (RelatedWords.Count > 0)
        {
            builder.Append(" | Relacionadas: ");
            builder.Append(string.Join(", ", RelatedWords.Take(4)));
        }

        return builder.ToString();
    }

    private static string Truncate(string value, int max)
    {
        if (value.Length <= max)
        {
            return value;
        }

        return value[..max] + "...";
    }
}

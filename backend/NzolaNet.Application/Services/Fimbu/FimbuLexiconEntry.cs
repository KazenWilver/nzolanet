namespace NzolaNet.Application.Services.Fimbu;

/// <summary>
/// Entrada do dicionário angolano usada pela Fimbu.
/// </summary>
public sealed class FimbuLexiconEntry
{
    public string Word { get; init; } = string.Empty;

    public string GrammarClass { get; init; } = string.Empty;

    public IReadOnlyList<string> MeaningsPt { get; init; } = [];

    public IReadOnlyList<string> UsageExamples { get; init; } = [];

    public IReadOnlyList<string> RelatedWords { get; init; } = [];

    public bool SensitiveContent { get; init; }

    public string CompactLine =>
        $"{Word}: {string.Join(" | ", MeaningsPt.Take(2))}";
}

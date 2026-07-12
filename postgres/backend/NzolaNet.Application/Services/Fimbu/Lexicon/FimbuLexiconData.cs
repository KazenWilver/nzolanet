namespace NzolaNet.Application.Services.Fimbu.Lexicon;

/// <summary>
/// Dados do léxico carregados em memória após merge dos três ficheiros oficiais.
/// </summary>
internal sealed class FimbuLexiconData
{
    public IReadOnlyList<FimbuLexiconEntry> Entries { get; init; } = [];

    public Dictionary<string, List<FimbuLexiconEntry>> WordIndex { get; init; } =
        new(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Exemplos de frases completas extraídos do ficheiro de treino — injectados
    /// no prompt para ensinar a IA a integrar calão em contexto, não palavras soltas.
    /// </summary>
    public IReadOnlyList<string> FewShotExamples { get; init; } = [];

    /// <summary>
    /// Resumo curto do ficheiro Markdown (cabeçalho e contexto do dicionário).
    /// </summary>
    public string MarkdownGuide { get; init; } = string.Empty;
}

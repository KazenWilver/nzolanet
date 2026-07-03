using System.Text;

namespace NzolaNet.Application.Services.Fimbu.Lexicon;

/// <summary>
/// Constrói o bloco de contexto do dicionário injectado no system prompt da Fimbu.
/// </summary>
internal static class FimbuLexiconContextBuilder
{
    public static string Build(
        FimbuLexiconData lexicon,
        IReadOnlyList<FimbuLexiconEntry> selectedEntries)
    {
        if (selectedEntries.Count == 0)
        {
            return string.Empty;
        }

        var builder = new StringBuilder();

        if (!string.IsNullOrWhiteSpace(lexicon.MarkdownGuide))
        {
            builder.AppendLine("## CONTEXTO DO DICIONÁRIO ANGOLANO");
            builder.AppendLine(lexicon.MarkdownGuide);
            builder.AppendLine();
        }

        builder.AppendLine("## CALÃO ANGOLANO — LÊ O DICIONÁRIO E USA MUITO");
        builder.AppendLine("- Fonte única: dicionario_angolano.md — cada entrada tem classe, significado e exemplo.");
        builder.AppendLine("- Mínimo 5 expressões desta lista por resposta, integradas em frases de rua angolana.");
        builder.AppendLine("- Se houver **Exemplo**, imita o ritmo da frase — adapta ao assunto.");
        builder.AppendLine("- **Relacionadas** servem para variar no mesmo tema sem repetir sempre a mesma palavra.");
        builder.AppendLine("- Não uses markdown no calão dentro da resposta.");
        builder.AppendLine();

        if (lexicon.FewShotExamples.Count > 0)
        {
            builder.AppendLine("## FRASES ANGOLANAS DE REFERÊNCIA (imita este ritmo e densidade de calão)");
            foreach (var example in lexicon.FewShotExamples)
            {
                builder.Append("- ");
                builder.AppendLine(Truncate(example, 180));
            }

            builder.AppendLine();
        }

        builder.AppendLine("## PALAVRAS PARA ESTA MENSAGEM (usa várias delas)");
        foreach (var entry in selectedEntries)
        {
            builder.AppendLine(entry.FormatForPrompt());
        }

        return builder.ToString().Trim();
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

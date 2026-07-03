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

        builder.AppendLine("## CALÃO ANGOLANO — USA SÓ O QUE FOR RELEVANTE");
        builder.AppendLine("- Fonte única: dicionario_angolano.md — cada entrada tem classe, significado e exemplo.");
        builder.AppendLine("- Escolhe 1 a 3 expressões desta lista no máximo, só quando encaixarem no assunto.");
        builder.AppendLine("- Se houver **Exemplo**, usa-o como referência de contexto, não para copiar frase inteira.");
        builder.AppendLine("- **Relacionadas** servem para variar sem inventar palavras fora do tema.");
        builder.AppendLine("- Não uses markdown no calão dentro da resposta.");
        builder.AppendLine();

        if (lexicon.FewShotExamples.Count > 0)
        {
            builder.AppendLine("## FRASES ANGOLANAS DE REFERÊNCIA (observa o ritmo e a naturalidade)");
            foreach (var example in lexicon.FewShotExamples.Take(4))
            {
                builder.Append("- ");
                builder.AppendLine(Truncate(example, 180));
            }

            builder.AppendLine();
        }

        builder.AppendLine("## PALAVRAS PARA ESTA MENSAGEM (usa só as que fizerem sentido)");
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

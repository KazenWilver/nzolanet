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

        builder.AppendLine("## CALÃO ANGOLANO — USA DE VERDADE (OBRIGATÓRIO NESTA RESPOSTA)");
        builder.AppendLine("- Fonte única: dicionario_angolano.md — cada entrada tem classe, significado e exemplo.");
        builder.AppendLine("- Usa pelo menos 3 expressões desta lista na resposta (ideal 3 a 6), em frases naturais.");
        builder.AppendLine("- Mistura palavras relevantes ao assunto com outras da lista para soar a conversa de rua em Angola.");
        builder.AppendLine("- Se houver **Exemplo**, usa-o como referência de ritmo, não para copiar a frase inteira.");
        builder.AppendLine("- **Relacionadas** servem para variar sem inventar palavras fora do tema.");
        builder.AppendLine("- Não uses markdown no calão dentro da resposta.");
        builder.AppendLine("- Quem lê tem de sentir que estás em Luanda, não num call center europeu.");
        builder.AppendLine();

        if (lexicon.FewShotExamples.Count > 0)
        {
            builder.AppendLine("## FRASES ANGOLANAS DE REFERÊNCIA (observa o ritmo e a naturalidade)");
            foreach (var example in lexicon.FewShotExamples.Take(6))
            {
                builder.Append("- ");
                builder.AppendLine(Truncate(example, 180));
            }

            builder.AppendLine();
        }

        builder.AppendLine("## PALAVRAS PARA ESTA MENSAGEM (escolhe várias e encaixa-as bem)");
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

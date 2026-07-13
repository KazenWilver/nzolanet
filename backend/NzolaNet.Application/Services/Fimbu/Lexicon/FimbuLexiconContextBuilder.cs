using System.Text;

namespace NzolaNet.Application.Services.Fimbu.Lexicon;

/// <summary>
/// Constrói o bloco de vocabulário do turno — alinhado a extras/prompt_engine.py.
/// Só lista termos seleccionados; não despeja o dicionário inteiro.
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

        builder.AppendLine("VOCABULÁRIO DISPONÍVEL PARA ESTE TURNO:");
        builder.AppendLine("Usa APENAS estes termos de calão (3 a 5 no total na resposta). Densidade média — tempero, não salada.");
        builder.AppendLine("Respeita a classe gramatical. Não inventes palavras fora desta lista.");
        builder.AppendLine();

        if (lexicon.FewShotExamples.Count > 0)
        {
            builder.AppendLine("Ritmo de referência (não copies à letra):");
            foreach (var example in lexicon.FewShotExamples.Take(4))
            {
                builder.Append("- ");
                builder.AppendLine(Truncate(example, 160));
            }

            builder.AppendLine();
        }

        foreach (var entry in selectedEntries)
        {
            builder.AppendLine(entry.FormatForPrompt());
            builder.AppendLine();
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

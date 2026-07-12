using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace NzolaNet.Application.Services.Fimbu.Lexicon;

internal static partial class FimbuLexiconTokenHelper
{
    public static IEnumerable<string> Tokenize(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            yield break;
        }

        foreach (Match match in TokenRegex().Matches(text.ToLowerInvariant()))
        {
            var token = Normalize(match.Value);
            if (token.Length >= 3)
            {
                yield return token;
            }
        }
    }

    public static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = value.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder();

        foreach (var ch in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(ch);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }

    [GeneratedRegex(@"[a-zà-ú0-9]+", RegexOptions.Compiled)]
    private static partial Regex TokenRegex();
}

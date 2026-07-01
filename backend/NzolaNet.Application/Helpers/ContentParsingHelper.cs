using System.Text.RegularExpressions;

namespace NzolaNet.Application.Helpers;

/// <summary>
/// Extrai menções e valida hashtags em texto de publicações.
/// </summary>
public static class ContentParsingHelper
{
    private static readonly Regex MentionRegex = new(
        @"@([A-Za-z0-9_.-]+)",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex HashtagRegex = new(
        @"#([A-Za-z0-9_\u00C0-\u024F]+)",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    /// <summary>
    /// Devolve usernames únicos mencionados no texto (sem o prefixo @).
    /// </summary>
    public static IReadOnlyList<string> ExtractMentions(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return Array.Empty<string>();
        }

        return MentionRegex.Matches(text)
            .Select(match => match.Groups[1].Value)
            .Where(username => !string.IsNullOrWhiteSpace(username))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    /// <summary>
    /// Verifica se o texto contém a hashtag indicada como token completo.
    /// </summary>
    public static bool ContainsHashtag(string? text, string tag)
    {
        if (string.IsNullOrWhiteSpace(text) || string.IsNullOrWhiteSpace(tag))
        {
            return false;
        }

        var normalizedTag = tag.Trim().TrimStart('#');
        foreach (Match match in HashtagRegex.Matches(text))
        {
            if (string.Equals(match.Groups[1].Value, normalizedTag, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}

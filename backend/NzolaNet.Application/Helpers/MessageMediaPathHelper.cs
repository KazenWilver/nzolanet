namespace NzolaNet.Application.Helpers;

/// <summary>
/// Normaliza caminhos de media de mensagens entre o formato legado (/messages) e o actual (/uploads/messages).
/// </summary>
public static class MessageMediaPathHelper
{
    private const string LegacyPrefix = "/messages/";
    private const string UploadsPrefix = "/uploads/messages/";

    /// <summary>
    /// Devolve variantes equivalentes do mesmo ficheiro para consulta na base de dados.
    /// </summary>
    public static IReadOnlyList<string> GetEquivalentPaths(string? mediaPath)
    {
        if (string.IsNullOrWhiteSpace(mediaPath))
        {
            return Array.Empty<string>();
        }

        var normalized = mediaPath.Replace('\\', '/');
        var paths = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { normalized };

        if (normalized.StartsWith(UploadsPrefix, StringComparison.OrdinalIgnoreCase))
        {
            paths.Add(LegacyPrefix + normalized[UploadsPrefix.Length..]);
        }
        else if (normalized.StartsWith(LegacyPrefix, StringComparison.OrdinalIgnoreCase))
        {
            paths.Add(UploadsPrefix + normalized[LegacyPrefix.Length..]);
        }

        return paths.ToList();
    }

    /// <summary>
    /// Caminho público servido pelo UploadsController.
    /// </summary>
    public static string ToUploadsPath(string? mediaPath)
    {
        if (string.IsNullOrWhiteSpace(mediaPath))
        {
            return string.Empty;
        }

        var normalized = mediaPath.Replace('\\', '/');
        if (normalized.StartsWith(UploadsPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return normalized;
        }

        if (normalized.StartsWith(LegacyPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return UploadsPrefix + normalized[LegacyPrefix.Length..];
        }

        return normalized;
    }
}

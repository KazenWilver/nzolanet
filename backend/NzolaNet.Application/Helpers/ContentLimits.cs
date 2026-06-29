namespace NzolaNet.Application.Helpers;

/// <summary>
/// Limites de conteúdo alinhados com o frontend.
/// </summary>
public static class ContentLimits
{
    public const int PublicationTextMaxLength = 280;
    public const int BioMaxLength = 160;
    public const int DisplayNameMaxLength = 50;

    public static void ValidatePublicationText(string? text)
    {
        if (text != null && text.Length > PublicationTextMaxLength)
        {
            throw new ArgumentException(
                $"O texto da publicação não pode exceder {PublicationTextMaxLength} caracteres.");
        }
    }

    public static void ValidateBio(string? bio)
    {
        if (bio != null && bio.Length > BioMaxLength)
        {
            throw new ArgumentException($"A bio não pode exceder {BioMaxLength} caracteres.");
        }
    }

    public static void ValidateDisplayName(string? displayName)
    {
        if (displayName != null && displayName.Length > DisplayNameMaxLength)
        {
            throw new ArgumentException(
                $"O nome de exibição não pode exceder {DisplayNameMaxLength} caracteres.");
        }
    }
}

namespace NzolaNet.Application.Helpers;

public static class FileHelper
{
    private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp"
    };

    private static readonly HashSet<string> AllowedVideoExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".mp4", ".mov", ".avi"
    };

    public static void ValidateImageExtension(string fileName)
    {
        var extension = Path.GetExtension(fileName);
        if (!AllowedImageExtensions.Contains(extension))
        {
            throw new ArgumentException(
                "Extensão de imagem inválida. Extensões permitidas: .jpg, .jpeg, .png, .gif, .webp.");
        }
    }

    public static void ValidateVideoExtension(string fileName)
    {
        var extension = Path.GetExtension(fileName);
        if (!AllowedVideoExtensions.Contains(extension))
        {
            throw new ArgumentException(
                "Extensão de vídeo inválida. Extensões permitidas: .mp4, .mov, .avi.");
        }
    }

    public static string BuildPublicationFileName(Guid publicationId, string originalFileName)
    {
        var extension = Path.GetExtension(originalFileName);
        return $"{publicationId}_{DateTime.UtcNow:yyyyMMddHHmmss}{extension}";
    }
}

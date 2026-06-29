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

    public const long MaxImageBytes = 10 * 1024 * 1024;
    public const long MaxVideoBytes = 52_428_800;

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

    public static void ValidateImageFile(Microsoft.AspNetCore.Http.IFormFile file)
    {
        ValidateImageExtension(file.FileName);
        if (file.Length > MaxImageBytes)
        {
            throw new ArgumentException("A imagem não pode exceder 10 MB.");
        }
    }

    public static void ValidateVideoFile(Microsoft.AspNetCore.Http.IFormFile file)
    {
        ValidateVideoExtension(file.FileName);
        if (file.Length > MaxVideoBytes)
        {
            throw new ArgumentException("O vídeo não pode exceder 50 MB.");
        }
    }

    public static string BuildPublicationFileName(Guid publicationId, string originalFileName)
    {
        var extension = Path.GetExtension(originalFileName);
        return $"{publicationId}_{DateTime.UtcNow:yyyyMMddHHmmss}{extension}";
    }
}

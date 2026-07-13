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

    private static readonly HashSet<string> AllowedImageContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/gif", "image/webp"
    };

    private static readonly HashSet<string> AllowedVideoContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "video/mp4", "video/quicktime", "video/x-msvideo", "video/avi"
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

        if (!string.IsNullOrWhiteSpace(file.ContentType) &&
            !AllowedImageContentTypes.Contains(file.ContentType))
        {
            throw new ArgumentException("Tipo de conteúdo de imagem inválido.");
        }

        if (file.Length > MaxImageBytes)
        {
            throw new ArgumentException("A imagem não pode exceder 10 MB.");
        }

        ValidateImageSignature(file);
    }

    public static void ValidateVideoFile(Microsoft.AspNetCore.Http.IFormFile file)
    {
        ValidateVideoExtension(file.FileName);

        if (!string.IsNullOrWhiteSpace(file.ContentType) &&
            !AllowedVideoContentTypes.Contains(file.ContentType))
        {
            throw new ArgumentException("Tipo de conteúdo de vídeo inválido.");
        }

        if (file.Length > MaxVideoBytes)
        {
            throw new ArgumentException("O vídeo não pode exceder 50 MB.");
        }

        ValidateVideoSignature(file);
    }

    private static readonly HashSet<string> AllowedDocumentExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".txt", ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".csv", ".rtf"
    };

    private static readonly HashSet<string> AllowedAudioExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".webm", ".ogg", ".mp3", ".m4a", ".mp4", ".wav", ".aac", ".caf"
    };

    public const long MaxDocumentBytes = 25 * 1024 * 1024;
    public const long MaxAudioBytes = 15 * 1024 * 1024;

    public static void ValidateDocumentFile(Microsoft.AspNetCore.Http.IFormFile file)
    {
        var extension = Path.GetExtension(file.FileName);
        if (!AllowedDocumentExtensions.Contains(extension))
        {
            throw new ArgumentException(
                "Extensão de documento inválida. Permitidos: .txt, .pdf, .doc, .docx, .ppt, .pptx e similares.");
        }

        if (file.Length > MaxDocumentBytes)
        {
            throw new ArgumentException("O documento não pode exceder 25 MB.");
        }

        if (file.Length == 0)
        {
            throw new ArgumentException("O documento está vazio.");
        }
    }

    public static void ValidateAudioFile(Microsoft.AspNetCore.Http.IFormFile file)
    {
        var extension = Path.GetExtension(file.FileName);
        if (!AllowedAudioExtensions.Contains(extension))
        {
            throw new ArgumentException(
                "Extensão de áudio inválida. Permitidos: .webm, .ogg, .mp3, .m4a, .mp4, .wav, .aac.");
        }

        if (file.Length > MaxAudioBytes)
        {
            throw new ArgumentException("O áudio não pode exceder 15 MB.");
        }

        if (file.Length == 0)
        {
            throw new ArgumentException("O áudio está vazio.");
        }
    }

    public static string BuildPublicationFileName(Guid publicationId, string originalFileName)
    {
        var extension = Path.GetExtension(originalFileName);
        return $"{publicationId}_{DateTime.UtcNow:yyyyMMddHHmmss}{extension}";
    }

    private static void ValidateImageSignature(Microsoft.AspNetCore.Http.IFormFile file)
    {
        using var stream = file.OpenReadStream();
        Span<byte> header = stackalloc byte[12];
        var read = stream.Read(header);

        if (read < 3)
        {
            throw new ArgumentException("Ficheiro de imagem inválido ou corrompido.");
        }

        var isJpeg = header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF;
        var isPng = read >= 8 &&
                    header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47;
        var isGif = read >= 6 &&
                    header[0] == 0x47 && header[1] == 0x49 && header[2] == 0x46;
        var isWebp = read >= 12 &&
                     header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46 &&
                     header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50;

        if (!isJpeg && !isPng && !isGif && !isWebp)
        {
            throw new ArgumentException("O conteúdo do ficheiro não corresponde a uma imagem válida.");
        }
    }

    private static void ValidateVideoSignature(Microsoft.AspNetCore.Http.IFormFile file)
    {
        using var stream = file.OpenReadStream();
        Span<byte> header = stackalloc byte[12];
        var read = stream.Read(header);

        if (read < 8)
        {
            throw new ArgumentException("Ficheiro de vídeo inválido ou corrompido.");
        }

        var isMp4 = header[4] == 0x66 && header[5] == 0x74 && header[6] == 0x79 && header[7] == 0x70;
        var isAvi = header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46;
        var isMov = isMp4;

        if (!isMp4 && !isAvi && !isMov)
        {
            throw new ArgumentException("O conteúdo do ficheiro não corresponde a um vídeo válido.");
        }
    }
}

namespace NzolaNet.Application.Interfaces;

/// <summary>
/// Valida se um utilizador autenticado pode aceder a um ficheiro de upload.
/// </summary>
public interface IMediaAccessService
{
    /// <summary>
    /// Verifica permissão de leitura para o caminho normalizado (ex.: /uploads/publications/foo.jpg).
    /// </summary>
    Task<bool> CanAccessAsync(Guid userId, string normalizedPath);
}

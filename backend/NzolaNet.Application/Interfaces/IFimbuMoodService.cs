namespace NzolaNet.Application.Interfaces;

/// <summary>
/// Gere o traço dominante da Fimbu por sessão de utilizador (sorteado no login).
/// </summary>
public interface IFimbuMoodService
{
    /// <summary>
    /// Devolve o traço da sessão activa ou sorteia um novo se ainda não existir.
    /// </summary>
    string GetOrAssignSessionTrait(Guid userId);

    /// <summary>
    /// Sorteia e guarda um novo traço — chamar no login ou registo.
    /// </summary>
    string AssignSessionTrait(Guid userId);

    /// <summary>
    /// Remove o traço da sessão (ex.: logout futuro).
    /// </summary>
    void ClearSessionTrait(Guid userId);
}

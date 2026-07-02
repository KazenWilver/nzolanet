namespace NzolaNet.Application.Services.Fimbu;

/// <summary>
/// Gere a combinação de personalidade da Fimbu associada a cada utilizador,
/// atribuída no primeiro pedido de uma sessão (login) e libertada no logout.
/// </summary>
public interface IFimbuMoodService
{
    /// <summary>
    /// Devolve a combinação de personalidade já atribuída a este utilizador nesta
    /// sessão, ou sorteia e regista uma nova se ainda não existir nenhuma.
    /// </summary>
    FimbuSessionMood GetOrAssignSessionMood(Guid userId);

    /// <summary>
    /// Remove a combinação associada ao utilizador. Deve ser chamado no logout
    /// para garantir que o próximo login sorteia uma personalidade nova.
    /// </summary>
    void ClearSessionMood(Guid userId);
}
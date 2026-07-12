namespace NzolaNet.Application.Interfaces;

/// <summary>
/// Fornece léxico angolano dinâmico para o prompt da Fimbu.
/// </summary>
public interface IFimbuLexiconService
{
    string BuildLexiconContext(string userMessage, Guid userId, int messageIndex);
}

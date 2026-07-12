using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NzolaNet.Application.Interfaces;
using NzolaNet.Application.Options;
using NzolaNet.Application.Services.Fimbu.Lexicon;

namespace NzolaNet.Application.Services.Fimbu;

/// <summary>
/// Orquestra o léxico angolano: carrega os três ficheiros oficiais, selecciona
/// entradas relevantes e constrói o contexto injectado no prompt da Fimbu.
/// </summary>
public sealed class FimbuLexiconService : IFimbuLexiconService
{
    private readonly ILogger<FimbuLexiconService> _logger;
    private readonly Lazy<FimbuLexiconData> _lexicon;

    public FimbuLexiconService(IOptions<FimbuSettings> settings, ILogger<FimbuLexiconService> logger)
    {
        _logger = logger;
        var fimbuSettings = settings.Value;

        _lexicon = new Lazy<FimbuLexiconData>(() => LoadSafely(fimbuSettings, _logger));
    }

    public string BuildLexiconContext(string userMessage, Guid userId, int messageIndex)
    {
        var lexicon = _lexicon.Value;
        if (lexicon.Entries.Count == 0)
        {
            return string.Empty;
        }

        var selected = FimbuLexiconSelector.Select(lexicon, userMessage, userId, messageIndex);
        if (selected.Count == 0)
        {
            return string.Empty;
        }

        return FimbuLexiconContextBuilder.Build(lexicon, selected);
    }

    private static FimbuLexiconData LoadSafely(FimbuSettings settings, ILogger logger)
    {
        try
        {
            return FimbuLexiconLoader.Load(settings, logger);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Fimbu léxico: falha inesperada ao carregar. Dicionário desactivado até correcção.");
            return new FimbuLexiconData();
        }
    }
}

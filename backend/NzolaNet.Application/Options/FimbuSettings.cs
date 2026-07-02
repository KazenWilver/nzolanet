namespace NzolaNet.Application.Options;

/// <summary>
/// Configuração da assistente Fimbu e dos fornecedores de LLM.
/// </summary>
public class FimbuSettings
{
    public const string SectionName = "Fimbu";

    public string OpenRouterApiKey { get; set; } = string.Empty;

    public string GoogleAiApiKey { get; set; } = string.Empty;

    public string GroqApiKey { get; set; } = string.Empty;

    public string NvidiaApiKey { get; set; } = string.Empty;

    public string OpenRouterModel { get; set; } = "deepseek/deepseek-v4-pro:free";

    public string GoogleAiModel { get; set; } = "gemini-3.5-flash";

    public string GroqModel { get; set; } = "openai/gpt-oss-120b";

    public string NvidiaModel { get; set; } = "nvidia/nemotron-3-super-120b-a12b";

    public int MaxHistoryMessages { get; set; } = 40;

    public int ProviderCooldownSeconds { get; set; } = 60;

    public int RequestTimeoutSeconds { get; set; } = 90;

    /// <summary>
    /// Máximo de tokens da resposta visível. Com raciocínio desligado, 2048 chega
    /// para respostas completas sem truncar o final da frase.
    /// </summary>
    public int MaxResponseTokens { get; set; } = 2048;

    /// <summary>
    /// Caminho opcional para a pasta palavras_angolanas.
    /// </summary>
    public string? LexiconPath { get; set; }
}

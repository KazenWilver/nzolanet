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

    /// <summary>2.º na ordem de failover — bom em personagem e instruções detalhadas.</summary>
    public string OpenRouterModel { get; set; } = "deepseek/deepseek-v4-pro:free";

    /// <summary>1.º na ordem de failover — melhor para PT-PT e calão angolano.</summary>
    public string GoogleAiModel { get; set; } = "gemini-3.5-flash";

    /// <summary>4.º na ordem de failover — último recurso.</summary>
    public string GroqModel { get; set; } = "openai/gpt-oss-120b";

    /// <summary>3.º na ordem de failover.</summary>
    public string NvidiaModel { get; set; } = "nvidia/nemotron-3-super-120b-a12b";

    public int MaxHistoryMessages { get; set; } = 40;

    public int ProviderCooldownSeconds { get; set; } = 60;

    public int RequestTimeoutSeconds { get; set; } = 90;

    /// <summary>
    /// Limite suficiente para respostas úteis, mas menor para reduzir divagações.
    /// </summary>
    public int MaxResponseTokens { get; set; } = 1200;

    /// <summary>
    /// Caminho opcional para a pasta palavras_angolanas.
    /// </summary>
    public string? LexiconPath { get; set; }
}

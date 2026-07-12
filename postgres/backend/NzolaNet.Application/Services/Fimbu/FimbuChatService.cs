using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NzolaNet.Application.DTOs.Fimbu;
using NzolaNet.Application.Interfaces;
using NzolaNet.Application.Options;

namespace NzolaNet.Application.Services.Fimbu;

/// <summary>
/// Serviço de chat da Fimbu com rotação automática entre fornecedores LLM.
/// </summary>
public sealed partial class FimbuChatService : IFimbuChatService
{
    [GeneratedRegex(@"<think>[\s\S]*?</think>", RegexOptions.IgnoreCase)]
    private static partial Regex ThinkBlockRegex();

    [GeneratedRegex(@"<SPECIAL_[^>]+>|_ERR[\w-]*|ANNAME|subsys", RegexOptions.IgnoreCase)]
    private static partial Regex CorruptionMarkerRegex();

    [GeneratedRegex(@"[\u0400-\u052F\u0600-\u06FF\u0B80-\u0BFF\u3040-\u30FF\u4E00-\u9FFF]")]
    private static partial Regex ForeignScriptRegex();

    [GeneratedRegex(@"\b(você|a gente|celular|bacana|cara|moça|moço|galera|legal|tudo bem)\b", RegexOptions.IgnoreCase)]
    private static partial Regex BrazilianMarkerRegex();

    [GeneratedRegex(@"<[^>]+>")]
    private static partial Regex GenericTagRegex();

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private static readonly TimeSpan PruneInterval = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan SessionIdleTimeout = TimeSpan.FromHours(2);

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly FimbuSettings _settings;
    private readonly IFimbuLexiconService _lexiconService;
    private readonly IFimbuMoodService _moodService;
    private readonly ILogger<FimbuChatService> _logger;
    private readonly ConcurrentDictionary<Guid, UserSession> _sessions = new();
    private readonly ProviderRotator _rotator;

    private readonly object _providersLock = new();
    private List<LlmProvider>? _cachedProviders;
    private long _lastPruneTicks = DateTime.UtcNow.Ticks;

    public FimbuChatService(
        IHttpClientFactory httpClientFactory,
        IOptions<FimbuSettings> settings,
        IFimbuLexiconService lexiconService,
        IFimbuMoodService moodService,
        ILogger<FimbuChatService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _settings = settings.Value;
        _lexiconService = lexiconService;
        _moodService = moodService;
        _logger = logger;
        _rotator = new ProviderRotator(_settings.ProviderCooldownSeconds);
    }

    public Task<FimbuHistoryDto> GetHistoryAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (!_sessions.TryGetValue(userId, out var session))
        {
            return Task.FromResult(new FimbuHistoryDto());
        }

        lock (session.Sync)
        {
            return Task.FromResult(new FimbuHistoryDto
            {
                Messages = session.Messages
                    .Select(m => new FimbuMessageDto
                    {
                        Role = m.Role,
                        Content = m.Content,
                        Timestamp = m.Timestamp
                    })
                    .ToList()
            });
        }
    }

    public Task ClearHistoryAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        _sessions.TryRemove(userId, out _);
        return Task.CompletedTask;
    }

    public async Task<FimbuChatResponseDto> SendMessageAsync(
        Guid userId,
        string message,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            throw new ArgumentException("A mensagem não pode estar vazia.");
        }

        PruneStaleSessionsIfDue();

        var trimmed = message.Trim();
        var session = _sessions.GetOrAdd(userId, _ => new UserSession());

        // Serializa o processamento por utilizador: se a mesma pessoa enviar
        // duas mensagens muito seguidas, a segunda espera a primeira terminar
        // em vez de disparar duas chamadas HTTP em paralelo e arriscar respostas
        // trocadas na conversa. Utilizadores diferentes continuam totalmente
        // paralelos entre si (cada um tem o seu próprio semáforo).
        await session.Gate.WaitAsync(cancellationToken);
        try
        {
            List<LlmMessage> historySnapshot;
            int messageIndex;
            string systemPrompt;
            double temperature;
            FimbuSessionMood sessionMood;

            lock (session.Sync)
            {
                session.LastActivity = DateTime.UtcNow;
                messageIndex = session.Messages.Count(m => m.Role == "user") + 1;
                session.Messages.Add(new LlmMessage("user", trimmed, DateTime.UtcNow));
                TrimHistory(session.Messages);
                historySnapshot = session.Messages.Select(m => m with { }).ToList();

                sessionMood = _moodService.GetOrAssignSessionMood(userId);
                var lexiconContext = _lexiconService.BuildLexiconContext(trimmed, userId, messageIndex);
                var lengthDirective = FimbuResponseLengthAdvisor.BuildDirective(trimmed, sessionMood.EnergyLevel);
                systemPrompt = FimbuSystemPrompt.Build(
                    sessionMood.PrimaryTrait,
                    sessionMood.SecondaryTrait,
                    sessionMood.EnergyLevel,
                    sessionMood.VerbalTic,
                    lexiconContext,
                    lengthDirective);
                temperature = sessionMood.Temperature;
            }

            var reply = await GenerateReplyAsync(historySnapshot, systemPrompt, temperature, cancellationToken);
            var timestamp = DateTime.UtcNow;

            lock (session.Sync)
            {
                session.Messages.Add(new LlmMessage("assistant", reply, timestamp));
                session.LastActivity = timestamp;
                TrimHistory(session.Messages);
            }

            return new FimbuChatResponseDto
            {
                Reply = reply,
                Timestamp = timestamp
            };
        }
        finally
        {
            session.Gate.Release();
        }
    }

    private void TrimHistory(List<LlmMessage> messages)
    {
        var max = Math.Max(4, _settings.MaxHistoryMessages);
        while (messages.Count > max)
        {
            messages.RemoveAt(0);
        }
    }

    /// <summary>
    /// Remove sessões inactivas há mais de <see cref="SessionIdleTimeout"/>,
    /// no máximo uma vez por <see cref="PruneInterval"/>. Evita que
    /// <c>_sessions</c> cresça indefinidamente enquanto a aplicação estiver
    /// de pé, sem precisar de um serviço em background dedicado.
    /// </summary>
    private void PruneStaleSessionsIfDue()
    {
        var now = DateTime.UtcNow;
        var lastTicks = Interlocked.Read(ref _lastPruneTicks);

        if (now - new DateTime(lastTicks, DateTimeKind.Utc) < PruneInterval)
        {
            return;
        }

        if (Interlocked.CompareExchange(ref _lastPruneTicks, now.Ticks, lastTicks) != lastTicks)
        {
            return; // outra thread já está a tratar disto
        }

        var cutoff = now - SessionIdleTimeout;
        var removed = 0;

        foreach (var (userId, session) in _sessions)
        {
            bool stale;
            lock (session.Sync)
            {
                stale = session.LastActivity < cutoff;
            }

            if (stale && _sessions.TryRemove(userId, out _))
            {
                removed++;
            }
        }

        if (removed > 0)
        {
            _logger.LogInformation("Fimbu: {Count} sessões inactivas removidas da memória.", removed);
        }
    }

    private async Task<string> GenerateReplyAsync(
        IReadOnlyList<LlmMessage> history,
        string systemPrompt,
        double temperature,
        CancellationToken cancellationToken)
    {
        var providers = GetProviders();
        if (providers.Count == 0)
        {
            throw new InvalidOperationException(
                "Nenhuma chave de API da Fimbu configurada. Define as variáveis NZOLANET_FIMBU_* no ambiente.");
        }

        var errors = new List<string>();
        var attempts = providers.Count;

        for (var i = 0; i < attempts; i++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var provider = _rotator.GetNextAvailable(providers);
            if (provider is null)
            {
                break;
            }

            try
            {
                var reply = await CallProviderAsync(provider, history, systemPrompt, temperature, cancellationToken);
                if (!TryValidateReply(reply, out var validationReason))
                {
                    var retryTemperature = Math.Max(0.45, temperature - 0.18);
                    if (Math.Abs(retryTemperature - temperature) > 0.001)
                    {
                        var retryReply = await CallProviderAsync(
                            provider,
                            history,
                            systemPrompt,
                            retryTemperature,
                            cancellationToken);

                        if (TryValidateReply(retryReply, out _))
                        {
                            _rotator.MarkSuccess(provider.Id);
                            return retryReply;
                        }
                    }

                    _logger.LogWarning(
                        "Fimbu: resposta inválida de {Provider}. Motivo: {Reason}",
                        provider.Name,
                        validationReason);
                    _rotator.MarkRateLimited(provider.Id);
                    errors.Add($"{provider.Name}: resposta inválida ({validationReason})");
                    continue;
                }

                _rotator.MarkSuccess(provider.Id);
                return reply;
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                // Cancelamento genuíno do utilizador (ex: fechou a conversa) —
                // não faz sentido tentar outro fornecedor, propaga de imediato.
                throw;
            }
            catch (RateLimitException ex)
            {
                _logger.LogWarning("Fimbu: limite atingido em {Provider}: {Message}", provider.Name, ex.Message);
                _rotator.MarkRateLimited(provider.Id);
                errors.Add($"{provider.Name}: limite de uso");
            }
            catch (Exception ex) when (IsRetryable(ex))
            {
                _logger.LogWarning(ex, "Fimbu: falha temporária em {Provider}", provider.Name);
                _rotator.MarkRateLimited(provider.Id);
                errors.Add($"{provider.Name}: {ex.Message}");
            }
        }

        throw new InvalidOperationException(
            errors.Count > 0
                ? $"Todas as APIs da Fimbu estão indisponíveis. Detalhes: {string.Join("; ", errors)}"
                : "Todas as APIs da Fimbu estão em cooldown. Tenta daqui a pouco.");
    }

    /// <summary>
    /// A lista de fornecedores só depende de configuração fixa no arranque
    /// (variáveis de ambiente lidas via IOptions), por isso é construída uma
    /// única vez e reutilizada — evita realocar dicionários e listas a cada
    /// mensagem enviada por qualquer utilizador.
    /// </summary>
    private List<LlmProvider> GetProviders()
    {
        if (_cachedProviders is not null)
        {
            return _cachedProviders;
        }

        lock (_providersLock)
        {
            _cachedProviders ??= BuildProviders();
            return _cachedProviders;
        }
    }

    /// <summary>
    /// Ordem de prioridade dos fornecedores LLM para o estilo Fimbu (PT-PT + calão angolano):
    /// 1. Google Gemini — melhor aderência ao português europeu e seguimento de prompts complexos.
    /// 2. OpenRouter (DeepSeek) — bom em personagem e instruções detalhadas.
    /// 3. NVIDIA Nemotron — alternativa sólida quando os anteriores falham.
    /// 4. Groq — último recurso; tende mais para português brasileiro.
    /// </summary>
    private List<LlmProvider> BuildProviders()
    {
        var list = new List<LlmProvider>();

        if (!string.IsNullOrWhiteSpace(_settings.GoogleAiApiKey))
        {
            list.Add(new LlmProvider(
                "google",
                "Google AI Studio",
                _settings.GoogleAiApiKey,
                _settings.GoogleAiModel,
                $"https://generativelanguage.googleapis.com/v1beta/models/{_settings.GoogleAiModel}:generateContent",
                ProviderKind.GoogleGemini,
                null,
                null));
        }

        if (!string.IsNullOrWhiteSpace(_settings.OpenRouterApiKey))
        {
            list.Add(new LlmProvider(
                "openrouter",
                "OpenRouter",
                _settings.OpenRouterApiKey,
                _settings.OpenRouterModel,
                "https://openrouter.ai/api/v1/chat/completions",
                ProviderKind.OpenAiCompatible,
                new Dictionary<string, string>
                {
                    ["HTTP-Referer"] = "https://nzolanet.app",
                    ["X-Title"] = "NzolaNet Fimbu"
                },
                new Dictionary<string, object>
                {
                    ["reasoning"] = new Dictionary<string, object> { ["enabled"] = false }
                }));
        }

        if (!string.IsNullOrWhiteSpace(_settings.NvidiaApiKey))
        {
            list.Add(new LlmProvider(
                "nvidia",
                "NVIDIA NIM",
                _settings.NvidiaApiKey,
                _settings.NvidiaModel,
                "https://integrate.api.nvidia.com/v1/chat/completions",
                ProviderKind.OpenAiCompatible,
                null,
                new Dictionary<string, object>
                {
                    ["chat_template_kwargs"] = new Dictionary<string, object> { ["enable_thinking"] = false }
                }));
        }

        if (!string.IsNullOrWhiteSpace(_settings.GroqApiKey))
        {
            list.Add(new LlmProvider(
                "groq",
                "Groq",
                _settings.GroqApiKey,
                _settings.GroqModel,
                "https://api.groq.com/openai/v1/chat/completions",
                ProviderKind.OpenAiCompatible,
                null,
                new Dictionary<string, object>
                {
                    ["reasoning_effort"] = "low"
                }));
        }

        return list;
    }

    private async Task<string> CallProviderAsync(
        LlmProvider provider,
        IReadOnlyList<LlmMessage> history,
        string systemPrompt,
        double temperature,
        CancellationToken cancellationToken)
    {
        return provider.Kind switch
        {
            ProviderKind.OpenAiCompatible => await CallOpenAiCompatibleAsync(provider, history, systemPrompt, temperature, cancellationToken),
            ProviderKind.GoogleGemini => await CallGoogleGeminiAsync(provider, history, systemPrompt, temperature, cancellationToken),
            _ => throw new NotSupportedException($"Fornecedor {provider.Kind} não suportado.")
        };
    }

    private async Task<string> CallOpenAiCompatibleAsync(
        LlmProvider provider,
        IReadOnlyList<LlmMessage> history,
        string systemPrompt,
        double temperature,
        CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient("FimbuLlm");
        using var request = new HttpRequestMessage(HttpMethod.Post, provider.Endpoint);
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", provider.ApiKey);

        if (provider.ExtraHeaders is not null)
        {
            foreach (var header in provider.ExtraHeaders)
            {
                request.Headers.TryAddWithoutValidation(header.Key, header.Value);
            }
        }

        var payload = new Dictionary<string, object>
        {
            ["model"] = provider.Model,
            ["temperature"] = temperature,
            ["max_tokens"] = Math.Max(512, _settings.MaxResponseTokens),
            ["messages"] = BuildOpenAiMessages(history, systemPrompt)
        };

        if (provider.ExtraBody is not null)
        {
            foreach (var entry in provider.ExtraBody)
            {
                payload[entry.Key] = entry.Value;
            }
        }

        request.Content = new StringContent(
            JsonSerializer.Serialize(payload, JsonOptions),
            Encoding.UTF8,
            "application/json");

        using var response = await client.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        // A verificação de sucesso vem primeiro de propósito: só olhamos para
        // padrões de texto como "quota"/"rate_limit" no corpo quando o pedido
        // já falhou. Caso contrário, uma resposta válida da Fimbu que mencione
        // essas palavras (ex: a explicar cotas de dados) seria mal classificada
        // como limite atingido.
        if (response.IsSuccessStatusCode)
        {
            var parsed = JsonSerializer.Deserialize<OpenAiChatResponse>(body, JsonOptions);
            var content = CleanReply(parsed?.Choices?.FirstOrDefault()?.Message?.Content);

            if (string.IsNullOrWhiteSpace(content))
            {
                throw new InvalidOperationException("Resposta vazia do modelo.");
            }

            return content;
        }

        if (IsRateLimited(response.StatusCode, body))
        {
            throw new RateLimitException($"HTTP {(int)response.StatusCode}");
        }

        throw new HttpRequestException($"HTTP {(int)response.StatusCode}: {Truncate(body, 300)}");
    }

    private async Task<string> CallGoogleGeminiAsync(
        LlmProvider provider,
        IReadOnlyList<LlmMessage> history,
        string systemPrompt,
        double temperature,
        CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient("FimbuLlm");
        var url = $"{provider.Endpoint}?key={Uri.EscapeDataString(provider.ApiKey)}";

        var contents = history.Select(m => new GeminiContent
        {
            Role = m.Role == "assistant" ? "model" : "user",
            Parts = [new GeminiPart { Text = m.Content }]
        }).ToList();

        var payload = new GeminiRequest
        {
            SystemInstruction = new GeminiContent
            {
                Parts = [new GeminiPart { Text = systemPrompt }]
            },
            Contents = contents,
            GenerationConfig = new GeminiGenerationConfig
            {
                Temperature = temperature,
                MaxOutputTokens = Math.Max(512, _settings.MaxResponseTokens),
                ThinkingConfig = new GeminiThinkingConfig { ThinkingBudget = 0 }
            }
        };

        using var response = await client.PostAsJsonAsync(url, payload, JsonOptions, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (response.IsSuccessStatusCode)
        {
            var parsed = JsonSerializer.Deserialize<GeminiResponse>(body, JsonOptions);
            var content = CleanReply(parsed?.Candidates?
                .FirstOrDefault()?
                .Content?
                .Parts?
                .FirstOrDefault()?
                .Text);

            if (string.IsNullOrWhiteSpace(content))
            {
                throw new InvalidOperationException("Resposta vazia do modelo Gemini.");
            }

            return content;
        }

        if (IsRateLimited(response.StatusCode, body))
        {
            throw new RateLimitException($"HTTP {(int)response.StatusCode}");
        }

        throw new HttpRequestException($"HTTP {(int)response.StatusCode}: {Truncate(body, 300)}");
    }

    /// <summary>
    /// Remove blocos de raciocínio (&lt;think&gt;...&lt;/think&gt;) que alguns modelos deixam escapar.
    /// Se sobrar uma tag de abertura sem fecho (resposta cortada a meio), corta
    /// tudo a partir dali — nunca deixa raciocínio interno vazar para o utilizador.
    /// </summary>
    private static string? CleanReply(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return raw;
        }

        var cleaned = ThinkBlockRegex().Replace(raw, string.Empty);
        cleaned = CorruptionMarkerRegex().Replace(cleaned, string.Empty);
        cleaned = GenericTagRegex().Replace(cleaned, string.Empty);
        cleaned = cleaned.Replace("\uFFFD", string.Empty, StringComparison.Ordinal);
        cleaned = Regex.Replace(cleaned, @"[\u0000-\u0008\u000B\u000C\u000E-\u001F]", string.Empty);

        var openIndex = cleaned.IndexOf("<think>", StringComparison.OrdinalIgnoreCase);
        if (openIndex >= 0)
        {
            cleaned = cleaned[..openIndex];
        }

        cleaned = Regex.Replace(cleaned, @"[ \t]{2,}", " ");
        cleaned = Regex.Replace(cleaned, @"\n{3,}", "\n\n");
        return cleaned.Trim();
    }

    private static bool TryValidateReply(string reply, out string reason)
    {
        if (string.IsNullOrWhiteSpace(reply))
        {
            reason = "vazia";
            return false;
        }

        if (reply.Length < 3)
        {
            reason = "demasiado curta";
            return false;
        }

        if (CorruptionMarkerRegex().IsMatch(reply))
        {
            reason = "marcadores corrompidos";
            return false;
        }

        if (ForeignScriptRegex().IsMatch(reply))
        {
            reason = "mistura de alfabetos";
            return false;
        }

        var letters = reply.Count(char.IsLetter);
        if (letters < 3)
        {
            reason = "sem texto suficiente";
            return false;
        }

        var brazilianMarkers = BrazilianMarkerRegex().Matches(reply).Count;
        if (brazilianMarkers >= 2)
        {
            reason = "português do brasil";
            return false;
        }

        reason = string.Empty;
        return true;
    }

    private static List<OpenAiMessage> BuildOpenAiMessages(IReadOnlyList<LlmMessage> history, string systemPrompt)
    {
        var messages = new List<OpenAiMessage>
        {
            new() { Role = "system", Content = systemPrompt }
        };

        messages.AddRange(history.Select(m => new OpenAiMessage
        {
            Role = m.Role,
            Content = m.Content
        }));

        return messages;
    }

    private static bool IsRateLimited(HttpStatusCode statusCode, string body)
    {
        if (statusCode is HttpStatusCode.TooManyRequests or HttpStatusCode.PaymentRequired)
        {
            return true;
        }

        if ((int)statusCode == 529)
        {
            return true;
        }

        return body.Contains("rate_limit", StringComparison.OrdinalIgnoreCase)
            || body.Contains("quota", StringComparison.OrdinalIgnoreCase)
            || body.Contains("RESOURCE_EXHAUSTED", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsRetryable(Exception ex)
    {
        return ex is HttpRequestException or TaskCanceledException or TimeoutException;
    }

    private static string Truncate(string value, int max)
    {
        if (string.IsNullOrEmpty(value) || value.Length <= max)
        {
            return value;
        }

        return value[..max] + "...";
    }

    private sealed class UserSession
    {
        public object Sync { get; } = new();

        /// <summary>Serializa mensagens sucessivas do mesmo utilizador.</summary>
        public SemaphoreSlim Gate { get; } = new(1, 1);

        public List<LlmMessage> Messages { get; } = [];

        public DateTime LastActivity { get; set; } = DateTime.UtcNow;
    }

    private sealed record LlmMessage(string Role, string Content, DateTime Timestamp);

    private enum ProviderKind
    {
        OpenAiCompatible,
        GoogleGemini
    }

    private sealed record LlmProvider(
        string Id,
        string Name,
        string ApiKey,
        string Model,
        string Endpoint,
        ProviderKind Kind,
        IReadOnlyDictionary<string, string>? ExtraHeaders,
        IReadOnlyDictionary<string, object>? ExtraBody);

    private sealed class RateLimitException : Exception
    {
        public RateLimitException(string message) : base(message)
        {
        }
    }

    private sealed class ProviderRotator
    {
        private readonly int _cooldownSeconds;
        private readonly ConcurrentDictionary<string, DateTime> _cooldowns = new();

        public ProviderRotator(int cooldownSeconds)
        {
            _cooldownSeconds = Math.Max(15, cooldownSeconds);
        }

        public LlmProvider? GetNextAvailable(IReadOnlyList<LlmProvider> providers)
        {
            if (providers.Count == 0)
            {
                return null;
            }

            var now = DateTime.UtcNow;

            for (var index = 0; index < providers.Count; index++)
            {
                var provider = providers[index];

                if (_cooldowns.TryGetValue(provider.Id, out var until) && until > now)
                {
                    continue;
                }

                return provider;
            }

            return null;
        }

        public void MarkRateLimited(string providerId)
        {
            _cooldowns[providerId] = DateTime.UtcNow.AddSeconds(_cooldownSeconds);
        }

        public void MarkSuccess(string providerId)
        {
            _cooldowns.TryRemove(providerId, out _);
        }
    }

    #region OpenAI JSON models

    private sealed class OpenAiMessage
    {
        public string Role { get; set; } = string.Empty;

        public string Content { get; set; } = string.Empty;
    }

    private sealed class OpenAiChatResponse
    {
        public List<OpenAiChoice>? Choices { get; set; }
    }

    private sealed class OpenAiChoice
    {
        public OpenAiMessage? Message { get; set; }
    }

    #endregion

    #region Gemini JSON models

    private sealed class GeminiRequest
    {
        public GeminiContent? SystemInstruction { get; set; }

        public List<GeminiContent> Contents { get; set; } = [];

        public GeminiGenerationConfig? GenerationConfig { get; set; }
    }

    private sealed class GeminiGenerationConfig
    {
        public double Temperature { get; set; }

        [JsonPropertyName("maxOutputTokens")]
        public int MaxOutputTokens { get; set; }

        [JsonPropertyName("thinkingConfig")]
        public GeminiThinkingConfig? ThinkingConfig { get; set; }
    }

    private sealed class GeminiThinkingConfig
    {
        [JsonPropertyName("thinkingBudget")]
        public int ThinkingBudget { get; set; }
    }

    private sealed class GeminiContent
    {
        public string Role { get; set; } = "user";

        public List<GeminiPart> Parts { get; set; } = [];
    }

    private sealed class GeminiPart
    {
        public string Text { get; set; } = string.Empty;
    }

    private sealed class GeminiResponse
    {
        public List<GeminiCandidate>? Candidates { get; set; }
    }

    private sealed class GeminiCandidate
    {
        public GeminiContent? Content { get; set; }
    }

    #endregion
}
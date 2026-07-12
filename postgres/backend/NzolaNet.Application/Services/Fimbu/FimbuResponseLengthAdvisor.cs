using System.Text.RegularExpressions;

namespace NzolaNet.Application.Services.Fimbu;

/// <summary>
/// Sugere o comprimento ideal da resposta da Fimbu com base na mensagem do utilizador e na energia da sessão.
/// </summary>
internal static partial class FimbuResponseLengthAdvisor
{
    public static string BuildDirective(string userMessage, string energyLevel)
    {
        var profile = ResolveProfile(userMessage, energyLevel);

        return profile switch
        {
            ResponseLengthProfile.Short => """
                ## COMPRIMENTO DESTA RESPOSTA: CURTA (OBRIGATÓRIO)
                - 1 a 2 frases no máximo (cerca de 15–60 palavras).
                - Vai direto ao ponto — sem introduções longas, sem repetir a pergunta, sem novelas.
                - Calão sim, mas compacto. Responde como mensagem rápida de WhatsApp.
                """,
            ResponseLengthProfile.Long => """
                ## COMPRIMENTO DESTA RESPOSTA: LONGA (SÓ AGORA)
                - O utilizador pediu detalhe ou o tema exige explicação — podes usar 4–8 frases ou mais.
                - Mesmo longa, mantém calão angolano e personalidade; não vires manual técnico seco.
                - Se puderes resumir no fim com uma frase curta, melhor.
                """,
            _ => """
                ## COMPRIMENTO DESTA RESPOSTA: MÉDIA (OBRIGATÓRIO)
                - 2 a 4 frases (cerca de 60–140 palavras). Este é o tamanho por defeito da Fimbu.
                - Responde o essencial com calão — não enches texto só para parecer simpática.
                - Se a resposta estiver a ficar longa, corta e fica na média.
                """
        };
    }

    private static ResponseLengthProfile ResolveProfile(string userMessage, string energyLevel)
    {
        var text = userMessage.Trim();
        if (string.IsNullOrWhiteSpace(text))
        {
            return ResponseLengthProfile.Medium;
        }

        var words = WordRegex().Matches(text).Count;
        var lower = text.ToLowerInvariant();

        if (WantsLongAnswer(lower) || words >= 45)
        {
            return ResponseLengthProfile.Long;
        }

        if (WantsShortAnswer(lower, words) || IsLowEnergy(energyLevel))
        {
            return ResponseLengthProfile.Short;
        }

        if (IsHighEnergy(energyLevel) && words <= 12 && !WantsLongAnswer(lower))
        {
            return ResponseLengthProfile.Medium;
        }

        return ResponseLengthProfile.Medium;
    }

    private static bool WantsLongAnswer(string lower) =>
        lower.Contains("explica")
        || lower.Contains("detalha")
        || lower.Contains("passo a passo")
        || lower.Contains("como é que")
        || lower.Contains("como fazer")
        || lower.Contains("porquê")
        || lower.Contains("por que")
        || lower.Contains("porque é")
        || lower.Contains("tutorial")
        || lower.Contains("define")
        || lower.Contains("descreve")
        || lower.Contains("elabora")
        || lower.Contains("em detalhe")
        || lower.Contains("tudo sobre");

    private static bool WantsShortAnswer(string lower, int words)
    {
        if (words <= 6)
        {
            return true;
        }

        if (GreetingRegex().IsMatch(lower))
        {
            return true;
        }

        return lower is "sim" or "não" or "nao" or "ok" or "ya" or "certo" or "obrigado" or "obrigada"
            || lower.StartsWith("olá") || lower.StartsWith("ola") || lower.StartsWith("ey")
            || lower.StartsWith("oi") || lower.StartsWith("hey");
    }

    private static bool IsLowEnergy(string energyLevel) =>
        energyLevel.Contains("baixa", StringComparison.OrdinalIgnoreCase);

    private static bool IsHighEnergy(string energyLevel) =>
        energyLevel.Contains("alta", StringComparison.OrdinalIgnoreCase)
        || energyLevel.Contains("instável", StringComparison.OrdinalIgnoreCase);

    [GeneratedRegex(@"\b[\p{L}]+\b", RegexOptions.Compiled)]
    private static partial Regex WordRegex();

    [GeneratedRegex(@"^(olá|ola|ey|oi|hey|bom dia|boa tarde|boa noite|tudo bem|como estás|como estas)\b", RegexOptions.IgnoreCase | RegexOptions.Compiled)]
    private static partial Regex GreetingRegex();

    private enum ResponseLengthProfile
    {
        Short,
        Medium,
        Long
    }
}

using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using NzolaNet.Application.Interfaces;
using NzolaNet.Application.Options;

namespace NzolaNet.Infrastructure.Services;

/// <summary>
/// Sends transactional email.
/// Prefers Resend HTTPS API (works on Render free). Falls back to MailKit SMTP
/// for local / paid plans (Gmail App Password like extras/main.py).
/// </summary>
public class EmailService : IEmailService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly ILogger<EmailService> _logger;
    private readonly EmailSettings _settings;
    private readonly IHostEnvironment _environment;
    private readonly IHttpClientFactory _httpClientFactory;

    public EmailService(
        ILogger<EmailService> logger,
        IOptions<EmailSettings> settings,
        IHostEnvironment environment,
        IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _settings = settings.Value;
        _environment = environment;
        _httpClientFactory = httpClientFactory;
    }

    public Task SendFollowRequestRejectedEmailAsync(string recipientEmail, string rejectorDisplayName)
    {
        if (string.IsNullOrWhiteSpace(recipientEmail))
        {
            return Task.CompletedTask;
        }

        var subject = "Pedido de seguimento recusado — NzolaNet";
        var body =
            $"Olá,\n\n{rejectorDisplayName} recusou o teu pedido de seguimento. " +
            "Não poderás ver as publicações desta conta enquanto o pedido não for aceite.\n\n" +
            "— Equipa NzolaNet";

        return SendAsync(recipientEmail, subject, body, htmlBody: null);
    }

    public Task SendPasswordResetEmailAsync(string recipientEmail, string resetLink)
    {
        if (string.IsNullOrWhiteSpace(recipientEmail))
        {
            return Task.CompletedTask;
        }

        var subject = "Recuperar palavra-passe — NzolaNet";
        var textBody =
            "Olá,\n\n" +
            "Recebemos um pedido para redefinir a tua palavra-passe no NzolaNet.\n\n" +
            $"Abre este link no navegador (válido por tempo limitado):\n{resetLink}\n\n" +
            "Se não fizeste este pedido, ignora este email.\n\n" +
            "— Equipa NzolaNet";

        var safeLink = WebUtility.HtmlEncode(resetLink);
        var htmlBody =
            "<p>Olá,</p>" +
            "<p>Recebemos um pedido para redefinir a tua palavra-passe no <b>NzolaNet</b>.</p>" +
            $"<p><a href=\"{safeLink}\">Clica aqui para redefinir a palavra-passe</a></p>" +
            "<p>Se o link não abrir, copia e cola este endereço no navegador:</p>" +
            $"<p style=\"word-break:break-all\">{safeLink}</p>" +
            "<p>Se não fizeste este pedido, ignora este email.</p>" +
            "<p>— Equipa NzolaNet</p>";

        return SendAsync(recipientEmail, subject, textBody, htmlBody);
    }

    private async Task SendAsync(
        string recipientEmail,
        string subject,
        string textBody,
        string? htmlBody)
    {
        if (!_settings.IsConfigured)
        {
            if (_environment.IsDevelopment())
            {
                _logger.LogWarning(
                    "Email não configurado (dev). Define RESEND_API_KEY (recomendado) ou EMAIL_USER + EMAIL_PASS. " +
                    "Destino: {Email}. Assunto: {Subject}",
                    recipientEmail,
                    subject);
                _logger.LogInformation("Corpo do email: {Body}", textBody);
                return;
            }

            throw new InvalidOperationException(
                "O envio de email não está configurado. Define RESEND_API_KEY no servidor.");
        }

        // Render free bloqueia SMTP 25/465/587 — Resend (HTTPS) primeiro.
        if (_settings.HasResend)
        {
            await SendViaResendAsync(recipientEmail, subject, textBody, htmlBody);
            return;
        }

        await SendViaSmtpAsync(recipientEmail, subject, textBody, htmlBody);
    }

    private async Task SendViaResendAsync(
        string recipientEmail,
        string subject,
        string textBody,
        string? htmlBody)
    {
        var from = string.IsNullOrWhiteSpace(_settings.ResendFrom)
            ? "NzolaNet <beth.t@example.com>"
            : _settings.ResendFrom.Trim();

        var payload = new Dictionary<string, object?>
        {
            ["from"] = from,
            ["to"] = new[] { recipientEmail },
            ["subject"] = subject,
            ["text"] = textBody
        };

        if (!string.IsNullOrWhiteSpace(htmlBody))
        {
            payload["html"] = htmlBody;
        }

        var client = _httpClientFactory.CreateClient("NzolaNetEmail");
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ResendApiKey.Trim());
        request.Content = new StringContent(
            JsonSerializer.Serialize(payload, JsonOptions),
            Encoding.UTF8,
            "application/json");

        try
        {
            using var response = await client.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "Resend falhou ({Status}): {Body}",
                    (int)response.StatusCode,
                    Truncate(body, 500));
                throw new InvalidOperationException(
                    "Não foi possível enviar o email de recuperação. Tenta novamente dentro de momentos.");
            }

            _logger.LogInformation(
                "Email enviado via Resend para {Email}. Assunto: {Subject}",
                recipientEmail,
                subject);
        }
        catch (InvalidOperationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao enviar email via Resend para {Email}", recipientEmail);
            throw new InvalidOperationException(
                "Não foi possível enviar o email de recuperação. Tenta novamente dentro de momentos.",
                ex);
        }
    }

    private async Task SendViaSmtpAsync(
        string recipientEmail,
        string subject,
        string textBody,
        string? htmlBody)
    {
        var smtpUser = NormalizeSecret(_settings.SmtpUser);
        var smtpPassword = NormalizeSecret(_settings.SmtpPassword);
        var fromAddress = string.IsNullOrWhiteSpace(_settings.From)
            ? smtpUser
            : _settings.From.Trim();

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(
            string.IsNullOrWhiteSpace(_settings.FromName) ? "NzolaNet" : _settings.FromName,
            fromAddress));
        message.To.Add(MailboxAddress.Parse(recipientEmail));
        message.Subject = subject;

        var builder = new BodyBuilder { TextBody = textBody };
        if (!string.IsNullOrWhiteSpace(htmlBody))
        {
            builder.HtmlBody = htmlBody;
        }

        message.Body = builder.ToMessageBody();

        var host = string.IsNullOrWhiteSpace(_settings.SmtpHost) ? "smtp.gmail.com" : _settings.SmtpHost;
        var port = _settings.SmtpPort > 0 ? _settings.SmtpPort : 465;

        try
        {
            using var client = new SmtpClient();
            client.Timeout = 15_000;

            var socketOptions = port == 587
                ? SecureSocketOptions.StartTls
                : SecureSocketOptions.SslOnConnect;

            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
            await client.ConnectAsync(host, port, socketOptions, cts.Token);
            await client.AuthenticateAsync(smtpUser, smtpPassword, cts.Token);
            await client.SendAsync(message, cts.Token);
            await client.DisconnectAsync(true, cts.Token);

            _logger.LogInformation("Email enviado via SMTP para {Email}. Assunto: {Subject}", recipientEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Falha SMTP ao enviar para {Email} via {Host}:{Port}. " +
                "No plano free do Render as portas SMTP estão bloqueadas — usa RESEND_API_KEY.",
                recipientEmail,
                host,
                port);

            var hint = !_environment.IsDevelopment()
                ? " O plano gratuito do Render bloqueia SMTP; configura RESEND_API_KEY (envio por HTTPS)."
                : string.Empty;

            throw new InvalidOperationException(
                "Não foi possível enviar o email de recuperação." + hint,
                ex);
        }
    }

    private static string NormalizeSecret(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        return value.Replace(" ", string.Empty, StringComparison.Ordinal).Trim();
    }

    private static string Truncate(string value, int max)
    {
        if (string.IsNullOrEmpty(value) || value.Length <= max)
        {
            return value;
        }

        return value[..max] + "...";
    }
}

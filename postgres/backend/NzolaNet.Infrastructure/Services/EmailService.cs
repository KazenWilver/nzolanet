using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NzolaNet.Application.Interfaces;
using NzolaNet.Application.Options;

namespace NzolaNet.Infrastructure.Services;

/// <summary>
/// Sends transactional email via SMTP (Gmail App Password compatible),
/// matching extras/main.py (SMTP_SSL on smtp.gmail.com:465).
/// In Development without SMTP, logs the body so local flows still work.
/// </summary>
public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly EmailSettings _settings;
    private readonly IHostEnvironment _environment;

    public EmailService(
        ILogger<EmailService> logger,
        IOptions<EmailSettings> settings,
        IHostEnvironment environment)
    {
        _logger = logger;
        _settings = settings.Value;
        _environment = environment;
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
                    "SMTP não configurado (dev). Email para {Email} (assunto: {Subject}) só ficou no log. " +
                    "Define EMAIL_USER + EMAIL_PASS para envio real.",
                    recipientEmail,
                    subject);
                _logger.LogInformation("Corpo do email: {Body}", textBody);
                return;
            }

            throw new InvalidOperationException(
                "O envio de email não está configurado no servidor. Contacta o administrador.");
        }

        var fromAddress = string.IsNullOrWhiteSpace(_settings.From)
            ? _settings.SmtpUser
            : _settings.From;

        using var message = new MailMessage
        {
            From = new MailAddress(fromAddress, _settings.FromName),
            Subject = subject,
            Body = string.IsNullOrWhiteSpace(htmlBody) ? textBody : htmlBody,
            IsBodyHtml = !string.IsNullOrWhiteSpace(htmlBody)
        };
        message.To.Add(recipientEmail);

        using var client = new SmtpClient(_settings.SmtpHost, _settings.SmtpPort)
        {
            EnableSsl = _settings.UseSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(_settings.SmtpUser, _settings.SmtpPassword)
        };

        try
        {
            await client.SendMailAsync(message);
            _logger.LogInformation("Email enviado para {Email}. Assunto: {Subject}", recipientEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao enviar email para {Email}", recipientEmail);
            throw new InvalidOperationException(
                "Não foi possível enviar o email de recuperação. Tenta novamente dentro de momentos.",
                ex);
        }
    }
}

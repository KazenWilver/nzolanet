using System.Net;
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
/// Sends transactional email via MailKit SMTP (Gmail App Password compatible),
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
        var smtpUser = NormalizeSecret(_settings.SmtpUser);
        var smtpPassword = NormalizeSecret(_settings.SmtpPassword);
        var fromAddress = string.IsNullOrWhiteSpace(_settings.From)
            ? smtpUser
            : _settings.From.Trim();

        if (string.IsNullOrWhiteSpace(smtpUser) || string.IsNullOrWhiteSpace(smtpPassword))
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
            // Gmail App Password: 465 SslOnConnect (como smtplib.SMTP_SSL) ou 587 StartTls
            var socketOptions = port == 587
                ? SecureSocketOptions.StartTls
                : SecureSocketOptions.SslOnConnect;

            await client.ConnectAsync(host, port, socketOptions);
            await client.AuthenticateAsync(smtpUser, smtpPassword);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email enviado para {Email}. Assunto: {Subject}", recipientEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Falha SMTP ao enviar para {Email} via {Host}:{Port} (user configurado={HasUser})",
                recipientEmail,
                host,
                port,
                !string.IsNullOrWhiteSpace(smtpUser));
            throw new InvalidOperationException(
                "Não foi possível enviar o email de recuperação. Tenta novamente dentro de momentos.",
                ex);
        }
    }

    /// <summary>
    /// Trim + remove spaces (Gmail App Passwords often paste as "xxxx xxxx xxxx xxxx").
    /// </summary>
    private static string NormalizeSecret(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        return value.Replace(" ", string.Empty, StringComparison.Ordinal).Trim();
    }
}

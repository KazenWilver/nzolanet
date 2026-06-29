using Microsoft.Extensions.Logging;
using NzolaNet.Application.Interfaces;

namespace NzolaNet.Infrastructure.Services;

/// <summary>
/// Serviço de email. Em desenvolvimento regista no log; em produção pode ser ligado a SMTP.
/// </summary>
public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;

    public EmailService(ILogger<EmailService> logger)
    {
        _logger = logger;
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

        _logger.LogInformation(
            "Email enviado para {Email}. Assunto: {Subject}. Corpo: {Body}",
            recipientEmail,
            subject,
            body);

        return Task.CompletedTask;
    }
}

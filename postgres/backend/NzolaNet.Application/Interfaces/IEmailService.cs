namespace NzolaNet.Application.Interfaces;

public interface IEmailService
{
    Task SendFollowRequestRejectedEmailAsync(string recipientEmail, string rejectorDisplayName);

    Task SendPasswordResetEmailAsync(string recipientEmail, string resetLink);
}

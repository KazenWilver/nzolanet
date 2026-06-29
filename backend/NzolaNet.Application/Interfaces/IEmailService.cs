namespace NzolaNet.Application.Interfaces;

public interface IEmailService
{
    Task SendFollowRequestRejectedEmailAsync(string recipientEmail, string rejectorDisplayName);
}

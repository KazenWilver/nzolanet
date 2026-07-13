namespace NzolaNet.Application.Options;

/// <summary>
/// SMTP settings for transactional email (password reset, etc.).
/// </summary>
public class EmailSettings
{
    public const string SectionName = "Email";

    /// <summary>Sender address (e.g. Gmail address).</summary>
    public string From { get; set; } = string.Empty;

    /// <summary>Display name shown in the inbox.</summary>
    public string FromName { get; set; } = "NzolaNet";

    /// <summary>SMTP host. Default: smtp.gmail.com</summary>
    public string SmtpHost { get; set; } = "smtp.gmail.com";

    /// <summary>SMTP port. Default: 465 (SSL).</summary>
    public int SmtpPort { get; set; } = 465;

    /// <summary>SMTP username (usually the Gmail address).</summary>
    public string SmtpUser { get; set; } = string.Empty;

    /// <summary>SMTP password or Gmail App Password.</summary>
    public string SmtpPassword { get; set; } = string.Empty;

    /// <summary>When true, uses SSL (SMTP_SSL). Matches extras/main.py.</summary>
    public bool UseSsl { get; set; } = true;

    /// <summary>
    /// Returns true when enough credentials exist to send real email.
    /// </summary>
    public bool IsConfigured
    {
        get
        {
            var user = (SmtpUser ?? string.Empty).Replace(" ", string.Empty).Trim();
            var pass = (SmtpPassword ?? string.Empty).Replace(" ", string.Empty).Trim();
            return user.Length > 0 && pass.Length > 0;
        }
    }
}

namespace NzolaNet.Application.Options;

/// <summary>
/// Email settings. Prefer Resend (HTTPS) on Render free tier — SMTP ports are blocked there.
/// SMTP (Gmail App Password) still works locally / on paid Render.
/// </summary>
public class EmailSettings
{
    public const string SectionName = "Email";

    /// <summary>Sender address (e.g. Gmail address or Resend from).</summary>
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
    /// Resend API key (HTTPS). Required on Render free because SMTP 25/465/587 are blocked.
    /// </summary>
    public string ResendApiKey { get; set; } = string.Empty;

    /// <summary>
    /// Resend "from" — e.g. "NzolaNet &lt;beth.t@example.com&gt;" until a domain is verified.
    /// </summary>
    public string ResendFrom { get; set; } = "NzolaNet <beth.t@example.com>";

    /// <summary>True when Resend or SMTP credentials exist.</summary>
    public bool IsConfigured => HasResend || HasSmtp;

    /// <summary>True when Resend API key is present.</summary>
    public bool HasResend => !string.IsNullOrWhiteSpace(ResendApiKey);

    /// <summary>True when Gmail/SMTP credentials exist.</summary>
    public bool HasSmtp
    {
        get
        {
            var user = (SmtpUser ?? string.Empty).Replace(" ", string.Empty).Trim();
            var pass = (SmtpPassword ?? string.Empty).Replace(" ", string.Empty).Trim();
            return user.Length > 0 && pass.Length > 0;
        }
    }
}

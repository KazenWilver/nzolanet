namespace NzolaNet.Application.DTOs.Admin;

/// <summary>
/// A hashtag together with how many times it has been used.
/// </summary>
public class AdminTopHashtagDto
{
    public string Tag { get; set; } = string.Empty;
    public int TotalUtilizacoes { get; set; }
}

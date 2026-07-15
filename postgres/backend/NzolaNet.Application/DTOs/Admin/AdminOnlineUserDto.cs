namespace NzolaNet.Application.DTOs.Admin;

/// <summary>
/// A user who currently has an active chat-hub connection (online).
/// </summary>
public class AdminOnlineUserDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? ProfilePhotoUrl { get; set; }
    public bool IsOnline { get; set; } = true;
}

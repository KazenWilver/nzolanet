namespace NzolaNet.Application.DTOs.Users;

public class UpdateProfileDto
{
    public string? DisplayName { get; set; }
    public string? Bio { get; set; }
    public bool? IsPrivate { get; set; }
}

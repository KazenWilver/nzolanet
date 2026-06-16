namespace NzolaNet.Application.DTOs.Users;

public class FollowResultDto
{
    public bool Success { get; set; }
    public bool IsPending { get; set; }
    public string Message { get; set; } = string.Empty;
}

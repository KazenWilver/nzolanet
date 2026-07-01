using System.ComponentModel.DataAnnotations;

namespace NzolaNet.Application.DTOs.Conversations;

public class ToggleMessageReactionDto
{
    [Required]
    [MaxLength(32)]
    public string Emoji { get; set; } = string.Empty;
}

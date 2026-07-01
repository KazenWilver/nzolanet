namespace NzolaNet.Application.DTOs.Fimbu;

public class FimbuChatRequestDto
{
    public string Message { get; set; } = string.Empty;
}

public class FimbuChatResponseDto
{
    public string Reply { get; set; } = string.Empty;

    public DateTime Timestamp { get; set; }
}

public class FimbuMessageDto
{
    public string Role { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public DateTime Timestamp { get; set; }
}

public class FimbuHistoryDto
{
    public IReadOnlyList<FimbuMessageDto> Messages { get; set; } = Array.Empty<FimbuMessageDto>();
}

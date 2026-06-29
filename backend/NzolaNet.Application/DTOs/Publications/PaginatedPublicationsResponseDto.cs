namespace NzolaNet.Application.DTOs.Publications;

public class PaginatedPublicationsResponseDto
{
    public IReadOnlyList<PublicationResponseDto> Items { get; set; } = Array.Empty<PublicationResponseDto>();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public bool HasMore { get; set; }
}

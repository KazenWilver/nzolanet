using Microsoft.AspNetCore.Http;

namespace NzolaNet.Application.DTOs.Publications;

public class CreatePublicationDto
{
    public string? Text { get; set; }
    public IFormFile? Image { get; set; }
    public IFormFile? Video { get; set; }
}

using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace NzolaNet.Application.DTOs.Posts;

public class CreatePostDto
{
    [StringLength(1000, ErrorMessage = "O texto da publicação não pode exceder 1000 caracteres.")]
    public string? Text { get; set; }

    public IFormFile? Image { get; set; }
    public IFormFile? Video { get; set; }
}

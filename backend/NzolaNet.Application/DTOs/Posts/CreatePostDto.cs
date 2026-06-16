using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace NzolaNet.Application.DTOs.Posts;

public class CreatePostDto
{
    [Required(ErrorMessage = "O texto da publicação é obrigatório.")]
    [StringLength(1000, ErrorMessage = "O texto da publicação não pode exceder 1000 caracteres.")]
    public string Text { get; set; } = string.Empty;

    public IFormFile? Image { get; set; }
    public IFormFile? Video { get; set; }
}

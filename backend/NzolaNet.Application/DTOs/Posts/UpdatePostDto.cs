using System.ComponentModel.DataAnnotations;

namespace NzolaNet.Application.DTOs.Posts;

public class UpdatePostDto
{
    [Required(ErrorMessage = "O texto da publicação é obrigatório.")]
    [StringLength(1000, ErrorMessage = "O texto da publicação não pode exceder 1000 caracteres.")]
    public string Text { get; set; } = string.Empty;
}

using System.ComponentModel.DataAnnotations;

namespace NzolaNet.Application.DTOs.Posts;

public class UpdatePostDto
{
    [Required(ErrorMessage = "O texto da publicação é obrigatório.")]
    [StringLength(280, ErrorMessage = "O texto da publicação não pode exceder 280 caracteres.")]
    public string Text { get; set; } = string.Empty;
}

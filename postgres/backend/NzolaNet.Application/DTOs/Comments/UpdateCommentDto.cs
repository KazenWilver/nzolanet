using System.ComponentModel.DataAnnotations;

namespace NzolaNet.Application.DTOs.Comments;

public class UpdateCommentDto
{
    [Required(ErrorMessage = "O texto do comentário é obrigatório.")]
    [MaxLength(1000, ErrorMessage = "O comentário não pode exceder 1000 caracteres.")]
    public string Text { get; set; } = string.Empty;
}

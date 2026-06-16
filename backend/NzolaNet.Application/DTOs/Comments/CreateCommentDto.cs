using System.ComponentModel.DataAnnotations;

namespace NzolaNet.Application.DTOs.Comments;

public class CreateCommentDto
{
    [Required(ErrorMessage = "O texto do comentário é obrigatório.")]
    [StringLength(500, ErrorMessage = "O comentário não pode exceder 500 caracteres.")]
    public string Text { get; set; } = string.Empty;
}

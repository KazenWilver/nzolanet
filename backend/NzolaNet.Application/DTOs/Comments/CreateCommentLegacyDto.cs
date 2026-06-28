using System;
using System.ComponentModel.DataAnnotations;

namespace NzolaNet.Application.DTOs.Comments;

public class CreateCommentLegacyDto
{
    [Required(ErrorMessage = "O ID da publicação é obrigatório.")]
    public Guid PostId { get; set; }

    [Required(ErrorMessage = "O texto do comentário é obrigatório.")]
    [MaxLength(1000, ErrorMessage = "O comentário não pode exceder 1000 caracteres.")]
    public string Text { get; set; } = string.Empty;
}

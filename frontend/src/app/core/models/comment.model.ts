// Representa um comentário associado a uma publicação
// Nota: evitado o nome "Comment" por conflito com o tipo nativo do DOM no TypeScript
export interface Comentario {
  id: number;
  postId: number;
  autorId: number;
  autorNome: string;
  autorFoto?: string;
  autorNomeUtilizador: string;
  texto: string;
  criadoEm: string;
  atualizadoEm?: string;
  reportsCount?: number;
  reportadoPorMim?: boolean;
  reports?: Array<{ userId: number; motivo: string; criadoEm: string }>;
}

// DTOs que separam os dados de entrada dos dados de saída (requisito técnico do enunciado)
export interface CriarComentarioDto {
  postId: number;
  texto: string;
}

export interface EditarComentarioDto {
  texto: string;
}

export interface DenunciarComentarioDto {
  motivo: string;
}
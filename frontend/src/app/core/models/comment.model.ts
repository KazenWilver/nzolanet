export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  publicationId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName?: string;
  authorPhotoUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface CreateCommentDto {
  text?: string;
}

export interface UpdateCommentDto {
  text: string;
}

export interface BackendCommentDto {
  id: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  publicationId: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName?: string;
  authorPhotoUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
}

/** @deprecated Usar Comment */
export interface Comentario {
  id: string;
  postId: string;
  autorId: string;
  autorNome: string;
  autorFoto?: string;
  autorNomeUtilizador: string;
  texto: string;
  criadoEm: string;
  atualizadoEm?: string;
  reportsCount?: number;
  reportadoPorMim?: boolean;
  reports?: Array<{ userId: string; motivo: string; criadoEm: string }>;
}

/** @deprecated Usar CreateCommentDto */
export interface CriarComentarioDto {
  postId: string;
  texto: string;
}

/** @deprecated Usar UpdateCommentDto */
export interface EditarComentarioDto {
  texto: string;
}

export interface DenunciarComentarioDto {
  motivo: string;
}

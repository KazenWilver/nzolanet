// Representa uma publicação completa com dados do autor desnormalizados para exibição directa
export interface Post {
  id: string;
  autorId: string;
  autorNome: string;
  autorFoto?: string;
  autorNomeUtilizador: string;
  texto: string;
  imagemUrl?: string;
  videoUrl?: string;
  totalBazes: number;
  totalComentarios: number;
  utilizadorDeuBaze: boolean; // indica se o utilizador autenticado já deu baze nesta publicação
  criadoEm: string;
  atualizadoEm?: string;
}

// DTOs usados para criar e editar — seguem o princípio de mínima exposição de dados
export interface CriarPostDto {
  texto: string;
  imagem?: File;
  video?: File;
}

export interface EditarPostDto {
  texto: string;
}
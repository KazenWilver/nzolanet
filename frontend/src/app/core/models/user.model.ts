// Representa o utilizador completo tal como vem do backend
export interface User {
  id: number;
  nome: string;
  nomeUtilizador: string;
  email: string;
  fotoPerfil?: string;
  fotoCapa?: string;
  bio?: string;
  localizacao?: string;
  totalSeguidores: number;
  totalSeguindo: number;
  totalPublicacoes: number;
  privado: boolean;
  eAdmin: boolean;
  estaASeguir?: boolean;
  criadoEm: string;
}

// DTOs enviados do frontend para o backend (separação de camadas conforme requisito técnico)
export interface LoginDto {
  email: string;
  senha: string;
}

export interface RegistoDto {
  nome: string;
  nomeUtilizador: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

export interface RecuperarSenhaDto {
  email: string;
}

// Resposta do backend após autenticação bem-sucedida
export interface RespostaAutenticacao {
  token: string;
  utilizador: User;
}
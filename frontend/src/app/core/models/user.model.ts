import type { BackendUserDto } from './auth.model';

export interface User {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  bio?: string;
  profilePhotoUrl?: string;
  isPrivate: boolean;
  followersCount: number;
  followingCount: number;
  createdAt: string;
  role?: string;
  isFollowing?: boolean;
}

export interface UpdateProfileDto {
  displayName?: string;
  bio?: string;
  isPrivate?: boolean;
}

/** @deprecated Usar User — mantido para compatibilidade com componentes existentes */
export interface LegacyUser {
  id: string;
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
  estaPendente?: boolean;
  criadoEm: string;
}

/** Formulário de login dos componentes existentes */
export interface LoginDto {
  email: string;
  senha: string;
}

/** @deprecated Usar LoginDto de auth.model nos novos serviços */
export interface LoginDtoLegacy {
  email: string;
  senha: string;
}

/** @deprecated Usar RegisterDto de auth.model */
export interface RegistoDto {
  nome: string;
  nomeUtilizador: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

/** @deprecated Usar ForgotPasswordDto de auth.model */
export interface RecuperarSenhaDto {
  email: string;
}

/** @deprecated Usar AuthResponse de auth.model */
export interface RespostaAutenticacao {
  token: string;
  utilizador: LegacyUser;
}

export const mapBackendUser = (dto: BackendUserDto): User => ({
  id: dto.id,
  username: dto.username,
  displayName: dto.displayName,
  email: dto.email,
  bio: dto.bio,
  profilePhotoUrl: dto.profilePhotoUrl,
  isPrivate: dto.isPrivate ?? false,
  followersCount: dto.followersCount ?? 0,
  followingCount: dto.followingCount ?? 0,
  createdAt: dto.createdAt,
  role: dto.role,
  isFollowing: dto.isFollowing
});

export const toLegacyUser = (user: User): LegacyUser => ({
  id: user.id,
  nome: user.displayName ?? user.username,
  nomeUtilizador: user.username,
  email: user.email ?? '',
  fotoPerfil: user.profilePhotoUrl,
  bio: user.bio,
  totalSeguidores: user.followersCount,
  totalSeguindo: user.followingCount,
  totalPublicacoes: 0,
  privado: user.isPrivate,
  eAdmin: user.role === 'Admin',
  estaASeguir: user.isFollowing,
  criadoEm: user.createdAt
});

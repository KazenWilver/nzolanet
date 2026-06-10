export interface TokenAutenticacao {
  token: string;
  expiracao: string;
}

export interface EstadoAutenticacao {
  autenticado: boolean;
  utilizadorId?: number;
}
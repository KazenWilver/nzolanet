import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginDto, RegistoDto, RecuperarSenhaDto, RespostaAutenticacao, User } from '../models/user.model';

// Serviço central de autenticação: gere o token JWT e o estado do utilizador autenticado
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly CHAVE_TOKEN = 'nzolanet_token';
  private readonly CHAVE_UTILIZADOR = 'nzolanet_user';
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  // BehaviorSubject permite que qualquer componente reaja a mudanças do utilizador autenticado
  private utilizadorAtual$ = new BehaviorSubject<User | null>(null);
  utilizador$ = this.utilizadorAtual$.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Ao arrancar a app, tenta restaurar a sessão a partir do token guardado
    this.carregarUtilizadorGuardado();
  }

  login(dados: LoginDto): Observable<RespostaAutenticacao> {
    return this.http.post<RespostaAutenticacao>(`${this.baseUrl}/login`, dados).pipe(
      tap(resposta => this.guardarSessao(resposta))
    );
  }

  registar(dados: RegistoDto): Observable<RespostaAutenticacao> {
    return this.http.post<RespostaAutenticacao>(`${this.baseUrl}/register`, dados).pipe(
      tap(resposta => this.guardarSessao(resposta))
    );
  }

  recuperarSenha(dados: RecuperarSenhaDto): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/recuperar-senha`, dados);
  }

  // Limpa o token e redireciona para o login — usado pelo error interceptor no 401
  terminarSessao(): void {
    localStorage.removeItem(this.CHAVE_TOKEN);
    localStorage.removeItem(this.CHAVE_UTILIZADOR);
    this.utilizadorAtual$.next(null);
    this.router.navigate(['/auth/login']);
  }

  obterToken(): string | null {
    return localStorage.getItem(this.CHAVE_TOKEN);
  }

  estaAutenticado(): boolean {
    return !!this.obterToken();
  }

  // Não confiar no flag `eAdmin` vindo do cliente. A verificação de admin é feita server-side.
  estaAdmin(): boolean {
    return false;
  }

  obterUtilizadorAtual(): User | null {
    return this.utilizadorAtual$.getValue();
  }

  atualizarUtilizadorAtual(utilizador: User): void {
    localStorage.setItem(this.CHAVE_UTILIZADOR, JSON.stringify(utilizador));
    this.utilizadorAtual$.next(utilizador);
  }

  private guardarSessao(resposta: any): void {
    const token = resposta.token;
    const backendUser = resposta.utilizador;
    const utilizador: User = {
      id: backendUser.id,
      nome: backendUser.username,
      nomeUtilizador: backendUser.username,
      email: backendUser.email,
      fotoPerfil: backendUser.profilePhoto || undefined,
      privado: backendUser.isPrivate || false,
      bio: backendUser.bio || undefined,
      totalSeguidores: backendUser.followersCount || 0,
      totalSeguindo: backendUser.followingCount || 0,
      totalPublicacoes: 0,
      eAdmin: false,
      criadoEm: backendUser.createdAt
    };

    localStorage.setItem(this.CHAVE_TOKEN, token);
    localStorage.setItem(this.CHAVE_UTILIZADOR, JSON.stringify(utilizador));
    this.utilizadorAtual$.next(utilizador);
    this.guardarContaSalva(utilizador);
  }

  private guardarContaSalva(utilizador: User): void {
    const contas: Array<{ email: string; nome: string; fotoPerfil?: string }> = JSON.parse(
      localStorage.getItem('nzolanet_contas_salvas') || '[]'
    );
    const jaExiste = contas.findIndex(c => c.email === utilizador.email) !== -1;
    if (!jaExiste) {
      contas.unshift({ email: utilizador.email, nome: utilizador.nome, fotoPerfil: utilizador.fotoPerfil });
      if (contas.length > 5) contas.pop();
      localStorage.setItem('nzolanet_contas_salvas', JSON.stringify(contas));
    }
  }

  private carregarUtilizadorGuardado(): void {
    const token = this.obterToken();
    if (!token) return;

    fetch(`${this.baseUrl}/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(async res => {
        if (!res.ok) {
          throw res;
        }
        const backendUser = await res.json();
        const utilizador: User = {
          id: backendUser.id,
          nome: backendUser.username,
          nomeUtilizador: backendUser.username,
          email: backendUser.email,
          fotoPerfil: backendUser.profilePhoto || undefined,
          privado: backendUser.isPrivate || false,
          bio: backendUser.bio || undefined,
          totalSeguidores: backendUser.followersCount || 0,
          totalSeguindo: backendUser.followingCount || 0,
          totalPublicacoes: 0,
          eAdmin: false,
          criadoEm: backendUser.createdAt
        };
        this.utilizadorAtual$.next(utilizador);
      })
      .catch(() => {
        this.terminarSessao();
      });
  }
}
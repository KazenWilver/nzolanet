import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

// Serviço que gere os dados de perfil e o sistema de seguimento entre utilizadores
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly baseUrl = `${environment.apiUrl}/users`;
  private readonly mediaBaseUrl = environment.apiUrl.replace('/api', '');

  constructor(private http: HttpClient) {}

  private formatarUrlMedia(url: string | undefined): string | undefined {
    if (!url) return undefined;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${this.mediaBaseUrl}${path}`;
  }

  private mapUser(u: any): User {
    return {
      id: u.id,
      nome: u.username || 'Utilizador',
      nomeUtilizador: u.username || 'utilizador',
      email: u.email || '',
      fotoPerfil: this.formatarUrlMedia(u.profilePhoto),
      bio: u.bio,
      totalSeguidores: u.followersCount || 0,
      totalSeguindo: u.followingCount || 0,
      totalPublicacoes: 0,
      privado: u.isPrivate || false,
      eAdmin: false,
      estaASeguir: u.isFollowing || false,
      estaPendente: u.isPending || false,
      criadoEm: new Date().toISOString()
    };
  }

  obterPorId(id: string): Observable<User> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(u => this.mapUser(u))
    );
  }

  obterSeguidores(id: string): Observable<User[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${id}/seguidores`).pipe(
      map(users => users.map(u => this.mapUser(u)))
    );
  }

  obterSeguindo(id: string): Observable<User[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${id}/seguindo`).pipe(
      map(users => users.map(u => this.mapUser(u)))
    );
  }

  // Cria a relação de seguimento — o backend impede auto-seguimento
  seguir(id: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${id}/follow`, {});
  }

  deixarDeSeguir(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}/follow`);
  }

  // Envia FormData para suportar actualização de foto de perfil junto com os restantes dados
  editarPerfil(id: string, dados: FormData): Observable<User> {
    const bio = dados.get('bio') as string;
    const privado = dados.get('privado') === 'true';

    // 1. Primeiro atualiza dados de texto
    return this.http.put<any>(`${this.baseUrl}/profile`, {
      Bio: bio,
      IsPrivate: privado
    }).pipe(
      // 2. Se tiver foto selecionada, envia a foto e atualiza o objeto final
      switchMap(userProfileDto => {
        const foto = dados.get('foto') as File;
        if (foto) {
          const fotoForm = new FormData();
          fotoForm.append('photoFile', foto);
          return this.http.post<any>(`${this.baseUrl}/photo`, fotoForm).pipe(
            map(photoRes => {
              userProfileDto.profilePhoto = photoRes.photoPath;
              return this.mapUser(userProfileDto);
            })
          );
        }
        return of(this.mapUser(userProfileDto));
      })
    );
  }

  // Métodos adicionados para suportar pedidos de seguimento pendentes
  obterPedidosPendentes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/follow-requests`);
  }

  aprovarPedido(followerId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/follow-requests/${followerId}/approve`, {});
  }

  rejeitarPedido(followerId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/follow-requests/${followerId}/reject`, {});
  }

  pesquisar(termo: string): Observable<User[]> {
    const query = termo.trim().toLowerCase();
    if (!query) return of([]);
    return this.http.get<any[]>(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`).pipe(
      map(users => users.map(u => this.mapUser(u)))
    );
  }
}
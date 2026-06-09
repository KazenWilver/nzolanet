import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

// Serviço que gere os dados de perfil e o sistema de seguimento entre utilizadores
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly baseUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  obterPorId(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  obterSeguidores(id: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/${id}/seguidores`);
  }

  obterSeguindo(id: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/${id}/seguindo`);
  }

  // Cria a relação de seguimento — o backend impede auto-seguimento
  seguir(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/seguir`, {});
  }

  deixarDeSeguir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/seguir`);
  }

  // Envia FormData para suportar actualização de foto de perfil junto com os restantes dados
  editarPerfil(id: number, dados: FormData): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, dados);
  }
}
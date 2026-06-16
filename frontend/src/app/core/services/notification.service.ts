import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Notificacao {
  id: string;
  tipo: 'baze' | 'comentario' | 'seguidor';
  utilizadorId: string;
  utilizadorNome: string;
  postId?: string;
  lida: boolean;
  criadoEm: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private baseUrl = `${environment.apiUrl}/notificacoes`;
  private notificacoes$ = new BehaviorSubject<Notificacao[]>([]);
  notificacoes = this.notificacoes$.asObservable();

  constructor(private http: HttpClient) {}

  obterNotificacoes(): Observable<Notificacao[]> {
    return this.http.get<Notificacao[]>(this.baseUrl);
  }

  marcarComoLidas(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/marcar-lidas`, {});
  }

  remover(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

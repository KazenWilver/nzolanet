import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Comentario, CriarComentarioDto, EditarComentarioDto } from '../models/comment.model';

// Serviço responsável pelas operações CRUD de comentários
// Cada comentário pertence a uma publicação — a relação é sempre passada no DTO
@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly baseUrl = `${environment.apiUrl}/comments`;

  constructor(private http: HttpClient) {}

  obterPorPost(postId: number): Observable<Comentario[]> {
    return this.http.get<Comentario[]>(`${this.baseUrl}/post/${postId}`);
  }

  criar(dados: CriarComentarioDto): Observable<Comentario> {
    return this.http.post<Comentario>(this.baseUrl, dados);
  }

  // Apenas o autor pode editar o seu próprio comentário — validado também no backend
  editar(id: number, dados: EditarComentarioDto): Observable<Comentario> {
    return this.http.put<Comentario>(`${this.baseUrl}/${id}`, dados);
  }

  denunciar(id: number, motivo: string): Observable<Comentario> {
    return this.http.post<Comentario>(`${this.baseUrl}/${id}/report`, { motivo });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
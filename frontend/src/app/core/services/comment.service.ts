import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Comentario, CriarComentarioDto, EditarComentarioDto } from '../models/comment.model';

// Serviço responsável pelas operações CRUD de comentários
@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly baseUrl = `${environment.apiUrl}/comments`;
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

  private mapComment(c: any): Comentario {
    const reportKey = `report_comment_${c.id}`;
    const reportadoPorMim = localStorage.getItem(`reported_comment_${c.id}`) === 'true';
    const reportCount = parseInt(localStorage.getItem(reportKey) || '0', 10);

    return {
      id: c.id,
      postId: c.postId,
      autorId: c.userId,
      autorNome: c.userName || 'Utilizador',
      autorFoto: this.formatarUrlMedia(c.userPhoto),
      autorNomeUtilizador: c.userName ? c.userName.toLowerCase().replace(/\s+/g, '') : 'utilizador',
      texto: c.text,
      criadoEm: c.createdAt,
      reportsCount: reportCount,
      reportadoPorMim: reportadoPorMim
    };
  }

  obterPorPost(postId: string): Observable<Comentario[]> {
    // Alinha a rota com a do backend: GET /api/posts/{postId}/comments
    return this.http.get<any[]>(`${environment.apiUrl}/posts/${postId}/comments`).pipe(
      map(comments => comments.map(c => this.mapComment(c)))
    );
  }

  criar(dados: CriarComentarioDto): Observable<Comentario> {
    return this.http.post<any>(this.baseUrl, {
      PostId: dados.postId,
      Text: dados.texto
    }).pipe(
      map(c => this.mapComment(c))
    );
  }

  // Apenas o autor pode editar o seu próprio comentário — validado também no backend
  editar(id: string, dados: EditarComentarioDto): Observable<Comentario> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, {
      Text: dados.texto
    }).pipe(
      map(c => this.mapComment(c))
    );
  }

  // Simula a denúncia do comentário com persistência no localStorage
  denunciar(id: string, motivo: string): Observable<Comentario> {
    const reportKey = `report_comment_${id}`;
    const userReportKey = `reported_comment_${id}`;
    let count = parseInt(localStorage.getItem(reportKey) || '0', 10);
    if (localStorage.getItem(userReportKey) !== 'true') {
      count++;
      localStorage.setItem(reportKey, count.toString());
      localStorage.setItem(userReportKey, 'true');
    }
    
    // Devolvemos um mock de comentário atualizado localmente
    const mockComment: Comentario = {
      id: id,
      postId: '',
      autorId: '',
      autorNome: 'Sistema',
      autorNomeUtilizador: 'sistema',
      texto: 'Comentário denunciado.',
      criadoEm: new Date().toISOString(),
      reportsCount: count,
      reportadoPorMim: true
    };
    return of(mockComment);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
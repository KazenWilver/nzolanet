import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { resolveMediaUrl } from '../helpers/media-url.helper';
import type {
  BackendCommentDto,
  Comment,
  Comentario,
  CreateCommentDto,
  CriarComentarioDto,
  EditarComentarioDto,
  UpdateCommentDto
} from '../models/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly baseUrl = `${environment.apiUrl}/comments`;
  private readonly publicationsUrl = `${environment.apiUrl}/publications`;

  constructor(private readonly http: HttpClient) {}

  getByPublication(publicationId: string): Observable<Comment[]> {
    return this.http
      .get<BackendCommentDto[]>(`${this.publicationsUrl}/${publicationId}/comments`)
      .pipe(map(comments => comments.map(comment => this.mapComment(comment))));
  }

  create(publicationId: string, dto: CreateCommentDto): Observable<Comment> {
    return this.http
      .post<BackendCommentDto>(`${this.publicationsUrl}/${publicationId}/comments`, {
        text: dto.text
      })
      .pipe(map(comment => this.mapComment(comment)));
  }

  update(id: string, dto: UpdateCommentDto): Observable<Comment> {
    return this.http
      .put<BackendCommentDto>(`${this.baseUrl}/${id}`, { text: dto.text })
      .pipe(map(comment => this.mapComment(comment)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** @deprecated Usar getByPublication */
  obterPorPost(postId: string): Observable<Comentario[]> {
    return this.getByPublication(postId).pipe(
      map(comments => comments.map(comment => this.toLegacyComment(comment)))
    );
  }

  /** @deprecated Usar create */
  criar(dados: CriarComentarioDto): Observable<Comentario> {
    return this.create(dados.postId, { text: dados.texto }).pipe(
      map(comment => this.toLegacyComment(comment))
    );
  }

  /** @deprecated Usar update */
  editar(id: string, dados: EditarComentarioDto): Observable<Comentario> {
    return this.update(id, { text: dados.texto }).pipe(
      map(comment => this.toLegacyComment(comment))
    );
  }

  /** @deprecated */
  eliminar(id: string): Observable<void> {
    return this.delete(id);
  }

  /** @deprecated */
  denunciar(id: string, motivo: string): Observable<Comentario> {
    const reportKey = `report_comment_${id}`;
    const userReportKey = `reported_comment_${id}`;
    let count = parseInt(localStorage.getItem(reportKey) || '0', 10);

    if (localStorage.getItem(userReportKey) !== 'true') {
      count += 1;
      localStorage.setItem(reportKey, count.toString());
      localStorage.setItem(userReportKey, 'true');
    }

    return of({
      id,
      postId: '',
      autorId: '',
      autorNome: 'Sistema',
      autorNomeUtilizador: 'sistema',
      texto: 'Comentário denunciado.',
      criadoEm: new Date().toISOString(),
      reportsCount: count,
      reportadoPorMim: true
    });
  }

  obterTodos(): Observable<Comentario[]> {
    return this.http.get<BackendCommentDto[]>(this.baseUrl).pipe(
      map(comments => comments.map(comment => this.toLegacyComment(this.mapComment(comment))))
    );
  }

  private mapComment(dto: BackendCommentDto): Comment {
    return {
      id: dto.id,
      text: dto.text,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      publicationId: dto.publicationId,
      authorId: dto.authorId,
      authorUsername: dto.authorUsername,
      authorDisplayName: dto.authorDisplayName,
      authorPhotoUrl: resolveMediaUrl(dto.authorPhotoUrl)
    };
  }

  private toLegacyComment(comment: Comment): Comentario {
    return {
      id: comment.id,
      postId: comment.publicationId,
      autorId: comment.authorId,
      autorNome: comment.authorDisplayName ?? comment.authorUsername,
      autorFoto: comment.authorPhotoUrl,
      autorNomeUtilizador: comment.authorUsername,
      texto: comment.text,
      criadoEm: comment.createdAt,
      atualizadoEm: comment.updatedAt
    };
  }
}

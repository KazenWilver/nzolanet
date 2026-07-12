import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { resolveMediaUrl } from '../helpers/media-url.helper';
import type {
  BackendCommentDto,
  Comment,
  CreateCommentDto
} from '../models/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly publicationsUrl = `${environment.apiUrl}/publications`;

  constructor(private readonly http: HttpClient) {}

  getByPublication(publicationId: string): Observable<Comment[]> {
    return this.http
      .get<BackendCommentDto[]>(`${this.publicationsUrl}/${publicationId}/comments`)
      .pipe(map(comments => comments.map(comment => this.mapComment(comment))));
  }

  create(publicationId: string, dto: CreateCommentDto): Observable<Comment> {
    const formData = new FormData();
    if (dto.text?.trim()) {
      formData.append('text', dto.text.trim());
    }
    return this.createWithMedia(publicationId, formData);
  }

  createWithMedia(publicationId: string, formData: FormData): Observable<Comment> {
    return this.http
      .post<BackendCommentDto>(`${this.publicationsUrl}/${publicationId}/comments`, formData)
      .pipe(map(comment => this.mapComment(comment)));
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
      authorPhotoUrl: resolveMediaUrl(dto.authorPhotoUrl),
      imageUrl: resolveMediaUrl(dto.imageUrl),
      videoUrl: resolveMediaUrl(dto.videoUrl)
    };
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { resolveMediaUrl } from '../helpers/media-url.helper';
import type {
  BackendPublicationDto,
  Publication,
  UpdatePublicationDto
} from '../models/publication.model';

@Injectable({ providedIn: 'root' })
export class PublicationService {
  private readonly baseUrl = `${environment.apiUrl}/publications`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Publication[]> {
    return this.http
      .get<BackendPublicationDto[]>(this.baseUrl)
      .pipe(map(publications => publications.map(publication => this.mapPublication(publication))));
  }

  getById(id: string): Observable<Publication> {
    return this.http
      .get<BackendPublicationDto>(`${this.baseUrl}/${id}`)
      .pipe(map(publication => this.mapPublication(publication)));
  }

  getByUser(userId: string): Observable<Publication[]> {
    return this.http
      .get<BackendPublicationDto[]>(`${this.baseUrl}/user/${userId}`)
      .pipe(map(publications => publications.map(publication => this.mapPublication(publication))));
  }

  create(formData: FormData): Observable<Publication> {
    return this.http
      .post<BackendPublicationDto>(this.baseUrl, formData)
      .pipe(map(publication => this.mapPublication(publication)));
  }

  update(id: string, dto: UpdatePublicationDto): Observable<Publication> {
    return this.http
      .put<BackendPublicationDto>(`${this.baseUrl}/${id}`, { text: dto.text })
      .pipe(map(publication => this.mapPublication(publication)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  like(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/like`, {});
  }

  unlike(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/like`);
  }

  private mapPublication(dto: BackendPublicationDto): Publication {
    return {
      id: dto.id,
      text: dto.text,
      imageUrl: resolveMediaUrl(dto.imageUrl),
      videoUrl: resolveMediaUrl(dto.videoUrl),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      authorId: dto.authorId,
      authorUsername: dto.authorUsername,
      authorDisplayName: dto.authorDisplayName,
      authorPhotoUrl: resolveMediaUrl(dto.authorPhotoUrl),
      likesCount: dto.likesCount ?? 0,
      commentsCount: dto.commentsCount ?? 0,
      hasLiked: dto.hasLiked ?? false
    };
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { resolveMediaUrl } from '../helpers/media-url.helper';
import type {
  BackendPaginatedPublicationsDto,
  BackendPublicationDto,
  PaginatedPublications,
  Publication,
  UpdatePublicationDto
} from '../models/publication.model';

@Injectable({ providedIn: 'root' })
export class PublicationService {
  private readonly baseUrl = `${environment.apiUrl}/publications`;
  private readonly createdSubject = new Subject<Publication>();
  private readonly repostedSubject = new Subject<Publication>();
  readonly created$ = this.createdSubject.asObservable();
  readonly reposted$ = this.repostedSubject.asObservable();
  readonly defaultPageSize = 20;

  constructor(private readonly http: HttpClient) {}

  getAll(page = 1, pageSize = this.defaultPageSize): Observable<PaginatedPublications> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    return this.http
      .get<BackendPaginatedPublicationsDto>(this.baseUrl, { params })
      .pipe(map(response => this.mapPaginated(response)));
  }

  getFollowingFeed(page = 1, pageSize = this.defaultPageSize): Observable<PaginatedPublications> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    return this.http
      .get<BackendPaginatedPublicationsDto>(`${this.baseUrl}/feed`, { params })
      .pipe(map(response => this.mapPaginated(response)));
  }

  getById(id: string): Observable<Publication> {
    return this.http
      .get<BackendPublicationDto>(`${this.baseUrl}/${id}`)
      .pipe(map(publication => this.mapPublication(publication)));
  }

  getByUser(
    userId: string,
    page = 1,
    pageSize = this.defaultPageSize,
    mediaOnly = false
  ): Observable<PaginatedPublications> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    if (mediaOnly) {
      params = params.set('mediaOnly', 'true');
    }

    return this.http
      .get<BackendPaginatedPublicationsDto>(`${this.baseUrl}/user/${userId}`, { params })
      .pipe(map(response => this.mapPaginated(response)));
  }

  getLikedByUser(userId: string): Observable<Publication[]> {
    return this.http
      .get<BackendPublicationDto[]>(`${environment.apiUrl}/users/${userId}/liked-publications`)
      .pipe(map(publications => publications.map(publication => this.mapPublication(publication))));
  }

  getUserReposts(
    userId: string,
    page = 1,
    pageSize = this.defaultPageSize
  ): Observable<PaginatedPublications> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    return this.http
      .get<BackendPaginatedPublicationsDto>(`${this.baseUrl}/user/${userId}/reposts`, { params })
      .pipe(
        map(response => this.mapPaginated(response)),
        catchError(() =>
          this.getByUser(userId, page, pageSize).pipe(
            map(response => ({
              ...response,
              items: response.items.filter(item => !!item.quotedPublication)
            }))
          )
        )
      );
  }

  create(formData: FormData): Observable<Publication> {
    return this.http
      .post<BackendPublicationDto>(this.baseUrl, formData)
      .pipe(
        map(publication => this.mapPublication(publication)),
        tap(publication => this.createdSubject.next(publication))
      );
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

  toggleRepost(id: string): Observable<{ hasReposted: boolean; repostsCount: number }> {
    return this.repost(id)
  }

  repost(
    id: string,
    text = ''
  ): Observable<{ hasReposted: boolean; repostsCount: number; quotedPublication?: Publication }> {
    return this.http
      .post<{
        hasReposted: boolean
        repostsCount: number
        quotedPublication?: BackendPublicationDto
      }>(`${this.baseUrl}/${id}/repost`, { text: text || null })
      .pipe(
        map(response => ({
          hasReposted: response.hasReposted,
          repostsCount: response.repostsCount,
          quotedPublication: response.quotedPublication
            ? this.mapPublication(response.quotedPublication)
            : undefined
        })),
        tap(response => {
          if (response.quotedPublication) {
            this.repostedSubject.next(response.quotedPublication);
          }
        })
      )
  }

  bookmark(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/bookmark`, {})
  }

  removeBookmark(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/bookmark`)
  }

  getMyBookmarks(page = 1, pageSize = this.defaultPageSize): Observable<PaginatedPublications> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize)

    return this.http
      .get<BackendPaginatedPublicationsDto>(`${environment.apiUrl}/users/me/bookmarks`, { params })
      .pipe(map(response => this.mapPaginated(response)))
  }

  private mapPaginated(dto: BackendPaginatedPublicationsDto): PaginatedPublications {
    return {
      items: dto.items.map(item => this.mapPublication(item)),
      page: dto.page,
      pageSize: dto.pageSize,
      totalCount: dto.totalCount,
      hasMore: dto.hasMore
    };
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
      repostsCount: dto.repostsCount ?? 0,
      bookmarksCount: dto.bookmarksCount ?? 0,
      hasLiked: dto.hasLiked ?? false,
      hasReposted: dto.hasReposted ?? false,
      hasBookmarked: dto.hasBookmarked ?? false,
      quotedPublication: dto.quotedPublication
        ? this.mapPublication(dto.quotedPublication)
        : undefined
    };
  }
}

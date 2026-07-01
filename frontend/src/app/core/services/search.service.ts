import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { resolveMediaUrl } from '../helpers/media-url.helper';
import type { BackendUserDto } from '../models/auth.model';
import { mapBackendUser, type User } from '../models/user.model';
import type { BackendPaginatedPublicationsDto, Publication } from '../models/publication.model';

export interface TrendingHashtag {
  tag: string;
  count: number;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly baseUrl = `${environment.apiUrl}/users`;
  private readonly publicationsBaseUrl = `${environment.apiUrl}/publications`;

  constructor(private readonly http: HttpClient) {}

  searchUsers(query: string): Observable<User[]> {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      return of([]);
    }

    return this.http
      .get<BackendUserDto[]>(`${this.baseUrl}/search?q=${encodeURIComponent(trimmed)}`)
      .pipe(map(users => users.map(user => this.mapUser(user))));
  }

  searchUsersDebounced(source$: Observable<string>): Observable<User[]> {
    return source$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => this.searchUsers(query))
    );
  }

  searchPublicationsByHashtag(tag: string): Observable<Publication[]> {
    const normalizedTag = tag.trim().replace(/^#/, '');
    if (!normalizedTag) {
      return of([]);
    }

    return this.http
      .get<BackendPaginatedPublicationsDto>(`${this.publicationsBaseUrl}/hashtag/${encodeURIComponent(normalizedTag)}`)
      .pipe(map(response => response.items.map(item => ({
        id: item.id,
        text: item.text,
        imageUrl: resolveMediaUrl(item.imageUrl),
        videoUrl: resolveMediaUrl(item.videoUrl),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        authorId: item.authorId,
        authorUsername: item.authorUsername,
        authorDisplayName: item.authorDisplayName,
        authorPhotoUrl: resolveMediaUrl(item.authorPhotoUrl),
        likesCount: item.likesCount ?? 0,
        commentsCount: item.commentsCount ?? 0,
        repostsCount: item.repostsCount ?? 0,
        hasLiked: item.hasLiked ?? false,
        hasReposted: item.hasReposted ?? false,
        hasBookmarked: item.hasBookmarked ?? false,
        bookmarksCount: item.bookmarksCount ?? 0
      }))));
  }

  getTrendingHashtags(limit = 5): Observable<TrendingHashtag[]> {
    return this.http.get<TrendingHashtag[]>(`${this.publicationsBaseUrl}/trending-hashtags?limit=${limit}`);
  }

  private mapUser(dto: BackendUserDto): User {
    const user = mapBackendUser({
      ...dto,
      profilePhotoUrl: dto.profilePhotoUrl ?? dto.profilePhoto,
      isPrivate: dto.isPrivate ?? false,
      followersCount: dto.followersCount ?? 0,
      followingCount: dto.followingCount ?? 0,
      createdAt: dto.createdAt ?? new Date(0).toISOString()
    });

    return {
      ...user,
      profilePhotoUrl: resolveMediaUrl(user.profilePhotoUrl)
    };
  }
}

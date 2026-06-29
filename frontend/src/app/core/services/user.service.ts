import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { resolveMediaUrl } from '../helpers/media-url.helper';
import { FeedTabService } from './feed-tab.service';
import type { BackendUserDto } from '../models/auth.model';
import { mapBackendUser, toLegacyUser, type LegacyUser, type UpdateProfileDto, type User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly baseUrl = `${environment.apiUrl}/users`;
  private readonly feedTabService = inject(FeedTabService);

  constructor(private readonly http: HttpClient) {}

  getProfile(userId: string): Observable<User> {
    return this.http
      .get<BackendUserDto>(`${this.baseUrl}/${userId}`)
      .pipe(map(user => this.mapUser(user)));
  }

  updateProfile(userId: string, dto: UpdateProfileDto): Observable<User> {
    return this.http
      .put<BackendUserDto>(`${this.baseUrl}/${userId}`, {
        displayName: dto.displayName,
        bio: dto.bio,
        isPrivate: dto.isPrivate
      })
      .pipe(map(user => this.mapUser(user)));
  }

  uploadPhoto(userId: string, file: File): Observable<User> {
    const formData = new FormData();
    formData.append('photo', file);

    return this.http
      .put<BackendUserDto>(`${this.baseUrl}/${userId}/photo`, formData)
      .pipe(map(user => this.mapUser(user)));
  }

  follow(userId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${userId}/follow`, {}).pipe(
      tap(() => this.feedTabService.markFollowingStale())
    );
  }

  unfollow(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}/follow`).pipe(
      tap(() => this.feedTabService.markFollowingStale())
    );
  }

  getFollowers(userId: string): Observable<User[]> {
    return this.http
      .get<BackendUserDto[]>(`${this.baseUrl}/${userId}/followers`)
      .pipe(map(users => users.map(user => this.mapUser(user))));
  }

  getFollowing(userId: string): Observable<User[]> {
    return this.http
      .get<BackendUserDto[]>(`${this.baseUrl}/${userId}/following`)
      .pipe(map(users => users.map(user => this.mapUser(user))));
  }

  /** @deprecated Usar getProfile */
  obterPorId(id: string): Observable<LegacyUser> {
    return this.getProfile(id).pipe(map(user => toLegacyUser(user)));
  }

  /** @deprecated Usar getFollowers */
  obterSeguidores(id: string): Observable<LegacyUser[]> {
    return this.getFollowers(id).pipe(map(users => users.map(user => toLegacyUser(user))));
  }

  /** @deprecated Usar getFollowing */
  obterSeguindo(id: string): Observable<LegacyUser[]> {
    return this.getFollowing(id).pipe(map(users => users.map(user => toLegacyUser(user))));
  }

  /** @deprecated Usar follow */
  seguir(id: string): Observable<void> {
    return this.follow(id);
  }

  /** @deprecated Usar unfollow */
  deixarDeSeguir(id: string): Observable<void> {
    return this.unfollow(id);
  }

  /** @deprecated Usar updateProfile + uploadPhoto */
  editarPerfil(id: string, dados: FormData): Observable<LegacyUser> {
    const bio = dados.get('bio') as string | null;
    const privado = dados.get('privado') === 'true';
    const foto = dados.get('foto') as File | null;

    return this.updateProfile(id, {
      bio: bio ?? undefined,
      isPrivate: privado
    }).pipe(
      switchMap(user => {
        if (foto) {
          return this.uploadPhoto(id, foto).pipe(map(updated => toLegacyUser(updated)));
        }
        return of(toLegacyUser(user));
      })
    );
  }

  obterPedidosPendentes(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.baseUrl}/follow-requests`);
  }

  aprovarPedido(followerId: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/follow-requests/${followerId}/approve`, {});
  }

  rejeitarPedido(followerId: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/follow-requests/${followerId}/reject`, {});
  }

  /** @deprecated Usar SearchService.searchUsers */
  pesquisar(termo: string): Observable<LegacyUser[]> {
    const query = termo.trim();
    if (!query) {
      return of([]);
    }

    return this.http
      .get<BackendUserDto[]>(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`)
      .pipe(map(users => users.map(user => toLegacyUser(this.mapUser(user)))));
  }

  private mapUser(dto: BackendUserDto): User {
    const user = mapBackendUser(dto);
    return {
      ...user,
      profilePhotoUrl: resolveMediaUrl(user.profilePhotoUrl)
    };
  }
}

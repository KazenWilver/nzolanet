import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { FeedTabService } from './feed-tab.service';
import type { BackendUserDto } from '../models/auth.model';
import { mapBackendUser, type UpdateProfileDto, type User } from '../models/user.model';

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

  getProfileByUsername(username: string): Observable<User> {
    return this.http
      .get<BackendUserDto>(`${this.baseUrl}/by-username/${encodeURIComponent(username)}`)
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

  uploadCoverPhoto(userId: string, file: File): Observable<User> {
    const formData = new FormData();
    formData.append('photo', file);

    return this.http
      .put<BackendUserDto>(`${this.baseUrl}/${userId}/cover`, formData)
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

  getSuggestions(count = 3, excludeIds: string[] = []): Observable<User[]> {
    const excludeQuery =
      excludeIds.length > 0 ? `&exclude=${excludeIds.join(',')}` : '';

    return this.http
      .get<BackendUserDto[]>(`${this.baseUrl}/suggestions?count=${count}${excludeQuery}`)
      .pipe(map(users => users.map(user => this.mapUser(user))));
  }

  approveFollowRequest(followerId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/follow-requests/${followerId}/approve`, {});
  }

  rejectFollowRequest(followerId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/follow-requests/${followerId}/reject`, {});
  }

  private mapUser(dto: BackendUserDto): User {
    return mapBackendUser(dto);
  }
}

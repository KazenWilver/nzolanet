import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { resolveMediaUrl } from '../helpers/media-url.helper';
import type { BackendUserDto } from '../models/auth.model';
import { mapBackendUser, type User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly baseUrl = `${environment.apiUrl}/users`;

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

  private mapUser(dto: BackendUserDto): User {
    const user = mapBackendUser(dto);
    return {
      ...user,
      profilePhotoUrl: resolveMediaUrl(user.profilePhotoUrl)
    };
  }
}

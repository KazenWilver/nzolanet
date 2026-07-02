import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  AuthResponse,
  BackendAuthResponseDto,
  ForgotPasswordDto,
  ForgotPasswordResponse,
  LoginDto,
  RegisterDto,
  ResetPasswordDto
} from '../models/auth.model';
import { mapBackendUser, type User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'nzolanet_token';
  private readonly userKey = 'nzolanet_user';
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {
    this.restoreSession();
  }

  login(dto: LoginDto): Observable<AuthResponse> {
    return this.http
      .post<BackendAuthResponseDto>(`${this.baseUrl}/login`, {
        email: dto.email,
        password: dto.password
      })
      .pipe(
        map(response => this.mapAuthResponse(response)),
        tap(response => this.persistSession(response))
      );
  }

  register(dto: RegisterDto): Observable<AuthResponse> {
    return this.http
      .post<BackendAuthResponseDto>(`${this.baseUrl}/register`, {
        username: dto.username,
        email: dto.email,
        password: dto.password,
        displayName: dto.displayName
      })
      .pipe(
        map(response => this.mapAuthResponse(response)),
        tap(response => this.persistSession(response))
      );
  }

  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    const dto: ForgotPasswordDto = { email }
    return this.http
      .post<{ message: string; devResetLink?: string }>(`${this.baseUrl}/forgot-password`, dto)
      .pipe(
        map(response => ({
          message: response.message,
          devResetLink: response.devResetLink
        }))
      )
  }

  resetPassword(dto: ResetPasswordDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/reset-password`, {
      email: dto.email,
      token: dto.token,
      newPassword: dto.newPassword,
      confirmNewPassword: dto.confirmNewPassword
    })
  }

  changePassword(
    currentPassword: string,
    newPassword: string,
    confirmNewPassword: string
  ): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/change-password`, {
      currentPassword,
      newPassword,
      confirmNewPassword
    });
  }

  logout(options?: { sessionExpired?: boolean }): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    void this.router.navigate(['/login'], {
      replaceUrl: true,
      queryParams: options?.sessionExpired ? { sessionExpired: '1' } : {}
    });
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.getValue();
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    if (this.isTokenExpired(token)) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
      this.currentUserSubject.next(null);
      return false;
    }

    return true;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  updateCurrentUser(user: User): void {
    const normalized = mapBackendUser({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      bio: user.bio,
      profilePhotoUrl: user.profilePhotoUrl,
      coverPhotoUrl: user.coverPhotoUrl,
      isPrivate: user.isPrivate,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      createdAt: user.createdAt,
      role: user.role,
      isFollowing: user.isFollowing,
      isPending: user.isPending
    });
    localStorage.setItem(this.userKey, JSON.stringify(normalized));
    this.currentUserSubject.next(normalized);
  }

  estaAdmin(): boolean {
    return this.getCurrentUser()?.role === 'Admin';
  }

  private mapAuthResponse(response: BackendAuthResponseDto): AuthResponse {
    return {
      token: response.token,
      user: mapBackendUser(response.user)
    };
  }

  private persistSession(response: AuthResponse): void {
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
    this.saveAccountShortcut(response.user);
  }

  private saveAccountShortcut(user: User): void {
    if (!user.email) {
      return;
    }

    const savedAccounts: Array<{ email: string; nome: string; fotoPerfil?: string }> = JSON.parse(
      localStorage.getItem('nzolanet_contas_salvas') || '[]'
    );

    const exists = savedAccounts.some(account => account.email === user.email);
    if (exists) {
      return;
    }

    savedAccounts.unshift({
      email: user.email,
      nome: user.displayName ?? user.username,
      fotoPerfil: user.profilePhotoUrl
    });

    if (savedAccounts.length > 5) {
      savedAccounts.pop();
    }

    localStorage.setItem('nzolanet_contas_salvas', JSON.stringify(savedAccounts));
  }

  private restoreSession(): void {
    const token = this.getToken();
    if (!token) {
      return;
    }

    const cachedUser = localStorage.getItem(this.userKey);
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser) as User;
        this.currentUserSubject.next(mapBackendUser({
          id: parsed.id,
          username: parsed.username,
          displayName: parsed.displayName,
          email: parsed.email,
          bio: parsed.bio,
          profilePhotoUrl: parsed.profilePhotoUrl,
          coverPhotoUrl: parsed.coverPhotoUrl,
          isPrivate: parsed.isPrivate,
          followersCount: parsed.followersCount,
          followingCount: parsed.followingCount,
          createdAt: parsed.createdAt,
          role: parsed.role,
          isFollowing: parsed.isFollowing,
          isPending: parsed.isPending
        }));
      } catch {
        localStorage.removeItem(this.userKey);
      }
    }

    this.http.get<BackendAuthResponseDto['user']>(`${this.baseUrl}/me`).subscribe({
      next: user => this.currentUserSubject.next(mapBackendUser(user)),
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.logout();
        }
      }
    });
  }

  private isTokenExpired(token: string): boolean {
    if (!token.includes('.')) {
      return false;
    }

    try {
      const payloadSegment = token.split('.')[1];
      if (!payloadSegment) {
        return false;
      }

      const payload = JSON.parse(atob(payloadSegment)) as { exp?: number };
      if (!payload.exp) {
        return false;
      }

      return Date.now() >= payload.exp * 1000;
    } catch {
      return false;
    }
  }
}

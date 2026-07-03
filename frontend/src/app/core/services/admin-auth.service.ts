import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Router } from '@angular/router'
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs'
import { environment } from '../../../environments/environment'
import { resolveMediaUrl } from '../helpers/media-url.helper'

export interface AdminUser {
  id: string
  username: string
  displayName?: string
  email?: string
  profilePhotoUrl?: string
  role?: string
}

export interface AdminLoginPayload {
  email: string
  password: string
}

export interface AdminRegisterPayload {
  username: string
  email: string
  password: string
  displayName?: string
  adminCode: string
}

interface BackendAdminUser {
  id: string
  username: string
  displayName?: string
  email?: string
  profilePhotoUrl?: string
  profilePhoto?: string
  role?: string
}

interface BackendAdminAuthResponse {
  token: string
  user: BackendAdminUser
}

/**
 * Manages the administrator session, kept isolated from the regular user
 * session by storing its own token and profile under dedicated keys.
 */
@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient)
  private readonly router = inject(Router)

  private readonly baseUrl = `${environment.apiUrl}/admin`
  private readonly tokenKey = 'admin_token'
  private readonly userKey = 'admin_user'

  private readonly currentAdminSubject = new BehaviorSubject<AdminUser | null>(this.restore())
  readonly currentAdmin$ = this.currentAdminSubject.asObservable()

  login(payload: AdminLoginPayload): Observable<AdminUser> {
    return this.http
      .post<BackendAdminAuthResponse>(`${this.baseUrl}/login`, payload)
      .pipe(
        map(response => this.persistSession(response)),
      )
  }

  register(payload: AdminRegisterPayload): Observable<AdminUser> {
    return this.http
      .post<BackendAdminAuthResponse>(`${this.baseUrl}/register`, payload)
      .pipe(
        map(response => this.persistSession(response)),
      )
  }

  verifyAccess(): Observable<boolean> {
    return this.http
      .get(`${this.baseUrl}/verify-access`, { headers: this.authHeaders() })
      .pipe(
        map(() => true),
        catchError(() => {
          this.clearSession()
          return of(false)
        }),
      )
  }

  logout(): void {
    this.clearSession()
    void this.router.navigate(['/admin/login'], { replaceUrl: true })
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey)
  }

  getCurrentAdmin(): AdminUser | null {
    return this.currentAdminSubject.getValue()
  }

  isAuthenticated(): boolean {
    const token = this.getToken()
    if (!token) {
      return false
    }

    if (this.isTokenExpired(token)) {
      this.clearSession()
      return false
    }

    return true
  }

  authHeaders(): Record<string, string> {
    const token = this.getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  private persistSession(response: BackendAdminAuthResponse): AdminUser {
    const admin = this.mapUser(response.user)
    localStorage.setItem(this.tokenKey, response.token)
    localStorage.setItem(this.userKey, JSON.stringify(admin))
    this.currentAdminSubject.next(admin)
    return admin
  }

  private clearSession(): void {
    localStorage.removeItem(this.tokenKey)
    localStorage.removeItem(this.userKey)
    this.currentAdminSubject.next(null)
  }

  private restore(): AdminUser | null {
    const raw = localStorage.getItem(this.userKey)
    if (!raw) {
      return null
    }

    try {
      return JSON.parse(raw) as AdminUser
    } catch {
      localStorage.removeItem(this.userKey)
      return null
    }
  }

  private mapUser(user: BackendAdminUser): AdminUser {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      profilePhotoUrl: resolveMediaUrl(user.profilePhotoUrl ?? user.profilePhoto),
      role: user.role,
    }
  }

  private isTokenExpired(token: string): boolean {
    if (!token.includes('.')) {
      return false
    }

    try {
      const payloadSegment = token.split('.')[1]
      if (!payloadSegment) {
        return false
      }

      const payload = JSON.parse(atob(payloadSegment)) as { exp?: number }
      if (!payload.exp) {
        return false
      }

      return Date.now() >= payload.exp * 1000
    } catch {
      return false
    }
  }
}

import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, map } from 'rxjs'
import { environment } from '../../../environments/environment'
import { AdminAuthService } from './admin-auth.service'
import { resolveMediaUrl } from '../helpers/media-url.helper'

export interface AdminTopHashtag {
  tag: string
  totalUtilizacoes: number
}

export interface AdminTopFollowed {
  id: string
  nome: string
  nomeUtilizador: string
  fotoPerfil?: string
  totalSeguidores: number
}

export interface AdminMetrics {
  totalUtilizadores: number
  totalUtilizadoresOnline: number
  totalUtilizadoresOffline: number
  totalPublicacoes: number
  totalComentarios: number
  totalBazes: number
  totalDenuncias: number
  totalPublicacoesDenunciadas: number
  totalComentariosDenunciados: number
  totalHashtagsCriadas: number
  totalFotografiasPartilhadas: number
  totalVideosPartilhados: number
  totalChatsCriados: number
  totalGruposCriados: number
  totalInteracoesFimbu: number
  totalMensagensFimbu: number
  topHashtags: AdminTopHashtag[]
  topPerfisSeguidos: AdminTopFollowed[]
}

export interface AdminReportEntry {
  reporterId: string
  reporterNome: string
  reporterNomeUtilizador: string
  motivo: string
  descricao?: string
  criadoEm: string
}

export interface ReportedComment {
  id: string
  postId: string
  autorId: string
  autorNome: string
  autorNomeUtilizador: string
  autorFoto?: string
  texto: string
  criadoEm: string
  atualizadoEm?: string
  reportsCount: number
  reports: AdminReportEntry[]
}

export interface ReportedPublication {
  id: string
  donoId: string
  donoNome: string
  donoNomeUtilizador: string
  donoFoto?: string
  texto: string
  imagemUrl?: string
  videoUrl?: string
  criadoEm: string
  atualizadoEm?: string
  reportsCount: number
  reports: AdminReportEntry[]
}

export interface AdminUserRow {
  id: string
  username: string
  displayName?: string
  email?: string
  profilePhotoUrl?: string
  isPrivate: boolean
  role: string
  followersCount: number
  followingCount: number
  publicacoesCount: number
  createdAt: string
}

/**
 * Talks to the administrator moderation endpoints, always attaching the
 * administrator token so the calls stay independent from the regular session.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient)
  private readonly adminAuth = inject(AdminAuthService)
  private readonly baseUrl = `${environment.apiUrl}/admin`

  obterMetricas(): Observable<AdminMetrics> {
    return this.http
      .get<AdminMetrics>(`${this.baseUrl}/metrics`, {
        headers: this.adminAuth.authHeaders(),
      })
      .pipe(map(metrics => ({
        ...metrics,
        topPerfisSeguidos: (metrics.topPerfisSeguidos ?? []).map(perfil => ({
          ...perfil,
          fotoPerfil: resolveMediaUrl(perfil.fotoPerfil),
        })),
      })))
  }

  obterComentariosDenunciados(): Observable<ReportedComment[]> {
    return this.http
      .get<ReportedComment[]>(`${this.baseUrl}/comments/reported`, {
        headers: this.adminAuth.authHeaders(),
      })
      .pipe(map(comments => comments.map(comment => ({
        ...comment,
        autorFoto: resolveMediaUrl(comment.autorFoto),
      }))))
  }

  obterPublicacoesDenunciadas(): Observable<ReportedPublication[]> {
    return this.http
      .get<ReportedPublication[]>(`${this.baseUrl}/publications/reported`, {
        headers: this.adminAuth.authHeaders(),
      })
      .pipe(map(publications => publications.map(publication => ({
        ...publication,
        donoFoto: resolveMediaUrl(publication.donoFoto),
        imagemUrl: resolveMediaUrl(publication.imagemUrl),
        videoUrl: resolveMediaUrl(publication.videoUrl),
      }))))
  }

  obterUtilizadores(): Observable<AdminUserRow[]> {
    return this.http
      .get<AdminUserRow[]>(`${this.baseUrl}/users`, {
        headers: this.adminAuth.authHeaders(),
      })
      .pipe(map(users => users.map(user => ({
        ...user,
        profilePhotoUrl: resolveMediaUrl(user.profilePhotoUrl),
      }))))
  }

  removerComentario(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/comments/${id}`, {
      headers: this.adminAuth.authHeaders(),
    })
  }

  ignorarDenunciasComentario(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/comments/${id}/dismiss`, {}, {
      headers: this.adminAuth.authHeaders(),
    })
  }

  removerPublicacao(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/publications/${id}`, {
      headers: this.adminAuth.authHeaders(),
    })
  }

  ignorarDenunciasPublicacao(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/publications/${id}/dismiss`, {}, {
      headers: this.adminAuth.authHeaders(),
    })
  }
}

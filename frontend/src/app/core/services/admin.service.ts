import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type AdminRankingPeriod = '24h' | '7d' | '30d'

export interface AdminMetrics {
  totalUtilizadores: number;
  totalUtilizadoresOnline: number;
  totalUtilizadoresOffline: number;
  totalPublicacoes: number;
  totalPublicacoesDenunciadas: number;
  totalComentarios: number;
  totalComentariosDenunciados: number;
  totalDenuncias: number;
  totalBazes: number;
  totalGrupos: number;
  totalMensagensEnviadas: number;
  totalMensagensRecebidas: number;
  totalGruposApagados: number;
  totalInteracoesIa: number;
  totalMensagensIa: number;
  mediaUtilizadoresOnlinePercentagem: number;
  mediaUtilizadoresOfflinePercentagem: number;
  mediaUsoIaPercentagem: number;
  totalHashtagsCriadas: number;
  topHashtagsMaisUsadas: AdminTopHashtag[];
  topPerfisMaisSeguidos: AdminTopPerfilSeguido[];
}

export interface AdminTopHashtag {
  hashtag: string;
  usos: number;
}

export interface AdminTopPerfilSeguido {
  userId: string;
  nome: string;
  nomeUtilizador: string;
  fotoPerfil?: string;
  totalSeguidores: number;
}

export interface AdminReportEntry {
  reporterId: string;
  reporterNome: string;
  reporterNomeUtilizador: string;
  motivo: string;
  descricao?: string;
  criadoEm: string;
}

export interface ComentarioReportado {
  id: string;
  postId: string;
  autorId: string;
  autorNome: string;
  autorFoto?: string;
  autorNomeUtilizador: string;
  texto: string;
  criadoEm: string;
  atualizadoEm?: string;
  reportsCount: number;
  reports: AdminReportEntry[];
}

export interface PublicacaoDenunciada {
  id: string;
  donoId: string;
  donoNome: string;
  donoNomeUtilizador: string;
  donoFoto?: string;
  texto: string;
  imagemUrl?: string;
  videoUrl?: string;
  criadoEm: string;
  atualizadoEm?: string;
  reportsCount: number;
  reports: AdminReportEntry[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  private getAdminHeaders(): { Authorization?: string } {
    const adminToken = localStorage.getItem('admin_token');
    return adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
  }

  obterMetricas(periodoRanking: AdminRankingPeriod = '30d'): Observable<AdminMetrics> {
    return this.http.get<AdminMetrics>(`${this.baseUrl}/metrics`, {
      params: { periodoRanking },
      headers: this.getAdminHeaders()
    });
  }

  obterComentariosDenunciados(): Observable<ComentarioReportado[]> {
    return this.http.get<ComentarioReportado[]>(`${this.baseUrl}/comments/reported`, {
      headers: this.getAdminHeaders()
    });
  }

  obterPublicacoesDenunciadas(): Observable<PublicacaoDenunciada[]> {
    return this.http.get<PublicacaoDenunciada[]>(`${this.baseUrl}/publications/reported`, {
      headers: this.getAdminHeaders()
    });
  }

  removerComentario(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/comments/${id}`, {
      headers: this.getAdminHeaders()
    });
  }

  removerPublicacao(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/publications/${id}`, {
      headers: this.getAdminHeaders()
    });
  }

  manterPublicacao(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/publications/${id}/dismiss`, {}, {
      headers: this.getAdminHeaders()
    });
  }
}

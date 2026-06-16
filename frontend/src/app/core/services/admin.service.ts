import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Comentario } from '../models/comment.model';

export interface AdminMetrics {
  totalUtilizadores: number;
  totalPublicacoes: number;
  totalComentarios: number;
  totalComentariosDenunciados: number;
  totalBazes: number;
}

export interface ComentarioReportado extends Comentario {
  reportsCount: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  private getAdminHeaders(): { Authorization?: string } {
    const adminToken = localStorage.getItem('admin_token');
    return adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
  }

  obterMetricas(): Observable<AdminMetrics> {
    return this.http.get<AdminMetrics>(`${this.baseUrl}/metrics`, {
      headers: this.getAdminHeaders()
    });
  }

  obterComentariosDenunciados(): Observable<ComentarioReportado[]> {
    return this.http.get<ComentarioReportado[]>(`${this.baseUrl}/comments/reported`, {
      headers: this.getAdminHeaders()
    });
  }

  removerComentario(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/comments/${id}`, {
      headers: this.getAdminHeaders()
    });
  }
}

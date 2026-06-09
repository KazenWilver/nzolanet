import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly baseUrl = `${environment.apiUrl}/upload`;

  constructor(private http: HttpClient) {}

  enviarImagem(ficheiro: File): Observable<{ url: string }> {
    const formulario = new FormData();
    formulario.append('ficheiro', ficheiro);
    return this.http.post<{ url: string }>(`${this.baseUrl}/imagem`, formulario);
  }

  enviarVideo(ficheiro: File): Observable<{ url: string }> {
    const formulario = new FormData();
    formulario.append('ficheiro', ficheiro);
    return this.http.post<{ url: string }>(`${this.baseUrl}/video`, formulario);
  }
}
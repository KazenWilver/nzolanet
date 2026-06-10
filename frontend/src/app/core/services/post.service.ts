import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Post, CriarPostDto, EditarPostDto } from '../models/post.model';

// Serviço responsável por toda a comunicação HTTP relacionada com publicações
@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly baseUrl = `${environment.apiUrl}/posts`;

  constructor(private http: HttpClient) {}

  // Obtém o feed paginado — publicações dos utilizadores seguidos por ordem cronológica
  obterFeed(pagina = 1, porPagina = 10): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}/feed?pagina=${pagina}&porPagina=${porPagina}`);
  }

  obterPorId(id: number): Observable<Post> {
    return this.http.get<Post>(`${this.baseUrl}/${id}`);
  }

  obterPorUtilizador(utilizadorId: number): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.baseUrl}/utilizador/${utilizadorId}`);
  }

  pesquisar(termo: string, pagina = 1, porPagina = 10): Observable<Post[]> {
    const query = encodeURIComponent(termo.trim());
    // Usar rota alternativa `/search/posts` do mock-backend para evitar conflitos
    return this.http.get<Post[]>(`${environment.apiUrl}/search/posts?q=${query}&pagina=${pagina}&porPagina=${porPagina}`);
  }

  // Envia os dados como FormData para suportar upload de imagem e vídeo
  criar(dados: CriarPostDto): Observable<Post> {
    const formulario = new FormData();
    formulario.append('texto', dados.texto);
    if (dados.imagem) formulario.append('imagem', dados.imagem);
    if (dados.video) formulario.append('video', dados.video);
    return this.http.post<Post>(this.baseUrl, formulario);
  }

  editar(id: number, dados: EditarPostDto): Observable<Post> {
    return this.http.put<Post>(`${this.baseUrl}/${id}`, dados);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Regra de negócio: um utilizador só pode dar baze uma vez (controlado também no backend)
  darBaze(id: number): Observable<{ totalBazes: number }> {
    return this.http.post<{ totalBazes: number }>(`${this.baseUrl}/${id}/baze`, {});
  }

  removerBaze(id: number): Observable<{ totalBazes: number }> {
    return this.http.delete<{ totalBazes: number }>(`${this.baseUrl}/${id}/baze`);
  }
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Post, CriarPostDto, EditarPostDto } from '../models/post.model';

// Serviço responsável por toda a comunicação HTTP relacionada com publicações
@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly baseUrl = `${environment.apiUrl}/posts`;
  private readonly mediaBaseUrl = environment.apiUrl.replace('/api', '');

  constructor(private http: HttpClient) {}

  private formatarUrlMedia(url: string | undefined): string | undefined {
    if (!url) return undefined;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${this.mediaBaseUrl}${path}`;
  }

  private mapPost(p: any): Post {
    const bazeKey = `baze_${p.id}`;
    const userBazeKey = `deu_baze_${p.id}`;
    const totalBazes = parseInt(localStorage.getItem(bazeKey) || '0', 10);
    const utilizadorDeuBaze = localStorage.getItem(userBazeKey) === 'true';

    return {
      id: p.id,
      autorId: p.userId,
      autorNome: p.userName || 'Utilizador',
      autorFoto: this.formatarUrlMedia(p.userPhoto),
      autorNomeUtilizador: p.userName ? p.userName.toLowerCase().replace(/\s+/g, '') : 'utilizador',
      texto: p.text,
      imagemUrl: this.formatarUrlMedia(p.imageUrl),
      videoUrl: this.formatarUrlMedia(p.videoUrl),
      totalBazes: totalBazes,
      totalComentarios: p.commentsCount || 0,
      utilizadorDeuBaze: utilizadorDeuBaze,
      criadoEm: p.createdAt
    };
  }

  // Obtém o feed paginado — publicações dos utilizadores seguidos por ordem cronológica
  obterFeed(pagina = 1, porPagina = 10): Observable<Post[]> {
    return this.http.get<any[]>(`${this.baseUrl}/feed`).pipe(
      map(posts => posts.map(p => this.mapPost(p)))
    );
  }

  obterPorId(id: string): Observable<Post> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(p => this.mapPost(p))
    );
  }

  obterPorUtilizador(utilizadorId: string): Observable<Post[]> {
    return this.http.get<any[]>(`${this.baseUrl}/utilizador/${utilizadorId}`).pipe(
      map(posts => posts.map(p => this.mapPost(p)))
    );
  }

  pesquisar(termo: string, pagina = 1, porPagina = 10): Observable<Post[]> {
    const query = termo.trim().toLowerCase();
    if (!query) return of([]);
    // Faz pesquisa filtrando na listagem pública/acessível
    return this.http.get<any[]>(this.baseUrl).pipe(
      map(posts => posts.map(p => this.mapPost(p)).filter(p =>
        p.texto.toLowerCase().includes(query) ||
        p.autorNome.toLowerCase().includes(query)
      ))
    );
  }

  // Envia os dados como FormData para suportar upload de imagem e vídeo
  criar(dados: CriarPostDto): Observable<Post> {
    const formulario = new FormData();
    formulario.append('Text', dados.texto);
    if (dados.imagem) formulario.append('Image', dados.imagem);
    if (dados.video) formulario.append('Video', dados.video);
    return this.http.post<any>(this.baseUrl, formulario).pipe(
      map(p => this.mapPost(p))
    );
  }

  editar(id: string, dados: EditarPostDto): Observable<Post> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, { Text: dados.texto }).pipe(
      map(p => this.mapPost(p))
    );
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Regra de negócio: um utilizador só pode dar baze uma vez (simulado com localStorage)
  darBaze(id: string): Observable<{ totalBazes: number }> {
    const bazeKey = `baze_${id}`;
    const userBazeKey = `deu_baze_${id}`;
    let count = parseInt(localStorage.getItem(bazeKey) || '0', 10);
    if (localStorage.getItem(userBazeKey) !== 'true') {
      count++;
      localStorage.setItem(bazeKey, count.toString());
      localStorage.setItem(userBazeKey, 'true');
    }
    return of({ totalBazes: count });
  }

  removerBaze(id: string): Observable<{ totalBazes: number }> {
    const bazeKey = `baze_${id}`;
    const userBazeKey = `deu_baze_${id}`;
    let count = parseInt(localStorage.getItem(bazeKey) || '0', 10);
    if (localStorage.getItem(userBazeKey) === 'true') {
      count = Math.max(0, count - 1);
      localStorage.setItem(bazeKey, count.toString());
      localStorage.setItem(userBazeKey, 'false');
    }
    return of({ totalBazes: count });
  }
}
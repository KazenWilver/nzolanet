import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostService } from '../../../core/services/post.service';
import { Post } from '../../../core/models/post.model';
import { PostCardComponent } from '../../../shared/components/post-card/post-card.component';
import { CreatePostComponent } from '../create-post/create-post.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

// Página principal do feed — apresenta publicações em ordem cronológica com paginação
@Component({
  selector: 'app-feed-page',
  standalone: true,
  imports: [CommonModule, PostCardComponent, CreatePostComponent, LoadingSpinnerComponent],
  templateUrl: './feed-page.component.html',
  styleUrl: './feed-page.component.scss'
})
export class FeedPageComponent implements OnInit {
  posts: Post[] = [];
  aCarregar = true;
  aCarregarMais = false;
  temMais = true;
  paginaAtual = 1;
  readonly porPagina = 10;

  constructor(private postService: PostService) {}

  ngOnInit(): void { this.carregarFeed(); }

  carregarFeed(): void {
    this.postService.obterFeed(this.paginaAtual, this.porPagina).subscribe({
      next: (lista: Post[]) => {
        this.posts = lista;
        // Se o backend devolver menos registos do que o pedido, não há mais páginas
        this.temMais = lista.length === this.porPagina;
        this.aCarregar = false;
      },
      error: () => { this.aCarregar = false; }
    });
  }

  carregarMais(): void {
    this.aCarregarMais = true;
    this.paginaAtual++;
    this.postService.obterFeed(this.paginaAtual, this.porPagina).subscribe({
      next: (lista: Post[]) => {
        // Concatena com os posts já carregados (paginação progressiva)
        this.posts = [...this.posts, ...lista];
        this.temMais = lista.length === this.porPagina;
        this.aCarregarMais = false;
      },
      error: () => { this.paginaAtual--; this.aCarregarMais = false; }
    });
  }

  // Adiciona o novo post no topo do feed sem recarregar a página
  adicionarPost(post: Post): void { this.posts = [post, ...this.posts]; }

  removerPost(id: number): void { this.posts = this.posts.filter(p => p.id !== id); }

  // trackBy melhora a performance do *ngFor evitando re-renderização desnecessária
  trackPorId(_: number, post: Post): number { return post.id; }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { PostService } from '../../../core/services/post.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { Post } from '../../../core/models/post.model';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';
import { PostCardComponent } from '../../../shared/components/post-card/post-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

// Página de perfil — funciona tanto para o perfil próprio como para perfis de terceiros
@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, RouterModule, UserAvatarComponent, PostCardComponent, LoadingSpinnerComponent],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss'
})
export class ProfilePageComponent implements OnInit {
  utilizador: User | null = null;
  posts: Post[] = [];
  aCarregarPosts = true;
  aAlterarSeguir = false;
  private utilizadorLogadoId?: number;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private postService: PostService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.utilizador$.subscribe((u: User | null) => this.utilizadorLogadoId = u?.id);
    // Reage a mudanças de parâmetro na URL (ex: navegar de um perfil para outro)
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.carregarPerfil(id);
    });
  }

  carregarPerfil(id: number): void {
    this.aCarregarPosts = true;
    this.userService.obterPorId(id).subscribe((u: User) => {
      this.utilizador = u;
      const podeVerPosts = !u.privado || this.utilizadorLogadoId === u.id || u.estaASeguir;
      if (podeVerPosts) {
        this.postService.obterPorUtilizador(id).subscribe({
          next: (lista: Post[]) => { this.posts = lista; this.aCarregarPosts = false; },
          error: () => { this.aCarregarPosts = false; }
        });
      } else {
        this.posts = [];
        this.aCarregarPosts = false;
      }
    });
  }

  // Determina se o perfil visualizado pertence ao utilizador autenticado
  // Controla a visibilidade do botão "Editar perfil" vs "Seguir"
  eMeuPerfil(): boolean {
    return this.utilizadorLogadoId === this.utilizador?.id;
  }

  alternarSeguir(): void {
    if (!this.utilizador) return;
    this.aAlterarSeguir = true;
    const acao = this.utilizador.estaASeguir
      ? this.userService.deixarDeSeguir(this.utilizador.id)
      : this.userService.seguir(this.utilizador.id);

    acao.subscribe({
      next: () => {
        if (this.utilizador) {
          this.utilizador.estaASeguir = !this.utilizador.estaASeguir;
          // Actualiza o contador localmente para feedback imediato
          this.utilizador.totalSeguidores += this.utilizador.estaASeguir ? 1 : -1;
        }
        this.aAlterarSeguir = false;
      },
      error: () => { this.aAlterarSeguir = false; }
    });
  }

  removerPost(id: number): void {
    this.posts = this.posts.filter(p => p.id !== id);
    if (this.utilizador) this.utilizador.totalPublicacoes--;
  }

  trackPorId(_: number, post: Post): number { return post.id; }
}
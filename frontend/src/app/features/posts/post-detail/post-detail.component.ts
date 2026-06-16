import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PostService } from '../../../core/services/post.service';
import { CommentService } from '../../../core/services/comment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Post } from '../../../core/models/post.model';
import { Comentario } from '../../../core/models/comment.model';
import { User } from '../../../core/models/user.model';
import { PostCardComponent } from '../../../shared/components/post-card/post-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
// Importação via barrel do módulo de comentários — evita acoplamento directo a shared/components
import { CommentFormComponent, CommentItemComponent } from '../../comments/comments.module';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, PostCardComponent, CommentFormComponent, CommentItemComponent, LoadingSpinnerComponent],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.scss'
})
export class PostDetailComponent implements OnInit {
  post: Post | null = null;
  comentarios: Comentario[] = [];
  utilizadorAtual: User | null = null;
  aCarregarComentarios = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private postService: PostService,
    private commentService: CommentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.utilizador$.subscribe((u: User | null) => this.utilizadorAtual = u);
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.postService.obterPorId(id).subscribe((p: Post) => {
      this.post = p;
      this.carregarComentarios(id);
    });
  }

  carregarComentarios(postId: string): void {
    this.commentService.obterPorPost(postId).subscribe({
      next: (lista: Comentario[]) => { this.comentarios = lista; this.aCarregarComentarios = false; },
      error: () => { this.aCarregarComentarios = false; }
    });
  }

  adicionarComentario(comentario: Comentario): void {
    this.comentarios = [comentario, ...this.comentarios];
    if (this.post) this.post.totalComentarios++;
  }

  removerComentario(id: string): void {
    this.comentarios = this.comentarios.filter(c => c.id !== id);
    if (this.post) this.post.totalComentarios--;
  }

  voltar(): void { this.router.navigate(['/feed']); }

  trackPorId(_: number, comentario: Comentario): string { return comentario.id; }
}
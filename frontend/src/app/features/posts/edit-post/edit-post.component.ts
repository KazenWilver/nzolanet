import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PostService } from '../../../core/services/post.service';
import { Post } from '../../../core/models/post.model';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-edit-post',
  standalone: true,
  imports: [CommonModule, FormsModule, UserAvatarComponent, LoadingSpinnerComponent],
  templateUrl: './edit-post.component.html',
  styleUrl: './edit-post.component.scss'
})
export class EditPostComponent implements OnInit {
  post: Post | null = null;
  textoEditado = '';
  aGuardar = false;
  limiteEdicaoExpirado = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private postService: PostService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.postService.obterPorId(id).subscribe((p: Post) => {
      this.post = p;
      this.textoEditado = p.texto;
      this.limiteEdicaoExpirado = !this.podeEditarPorTempo(p.criadoEm);
    });
  }

  guardar(): void {
    if (!this.post || !this.textoEditado.trim()) return;
    if (this.limiteEdicaoExpirado) return;
    this.aGuardar = true;
    this.postService.editar(this.post.id, { texto: this.textoEditado.trim() }).subscribe({
      next: () => this.router.navigate(['/publicacoes', this.post!.id]),
      error: () => { this.aGuardar = false; }
    });
  }

  private podeEditarPorTempo(criadoEm: string): boolean {
    const criado = new Date(criadoEm).getTime();
    const limiteEdicao = 1000 * 60 * 60 * 24 * 7; // 7 dias
    return Date.now() - criado <= limiteEdicao;
  }

  voltar(): void { this.router.navigate(['/publicacoes', this.post?.id]); }
}
import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Post } from '../../../core/models/post.model';
import { PostService } from '../../../core/services/post.service';
import { AuthService } from '../../../core/services/auth.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { MediaPreviewComponent } from '../media-preview/media-preview.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

// Componente reutilizável que representa uma publicação no feed e no perfil
// Gere bazes, navegação para detalhe, edição e eliminação
@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, RouterModule, TimeAgoPipe, UserAvatarComponent, MediaPreviewComponent, ConfirmDialogComponent],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss'
})
export class PostCardComponent {
  @Input({ required: true }) post!: Post;
  // Emite o id da publicação eliminada para o componente pai actualizar a lista
  @Output() eliminado = new EventEmitter<string>();

  opcoesAbertas = false;
  dialogoEliminacao = false;

  constructor(
    private postService: PostService,
    private authService: AuthService
  ) {}

  podeEditarPublicacao(): boolean {
    return this.eMinhaPub() && this.podeEditarPorTempo();
  }

  private podeEditarPorTempo(): boolean {
    const criadoEm = new Date(this.post.criadoEm).getTime();
    const limiteEdicao = 1000 * 60 * 60 * 24 * 7; // 7 dias
    return Date.now() - criadoEm <= limiteEdicao;
  }

  // Verifica se a publicação pertence ao utilizador autenticado
  eMinhaPub(): boolean {
    return this.authService.obterUtilizadorAtual()?.id === this.post.autorId;
  }

  alternarOpcoes(): void { this.opcoesAbertas = !this.opcoesAbertas; }

  // Toggle de baze: actualiza o estado local imediatamente para feedback instantâneo
  alternarBaze(): void {
    this.postService.darBaze(this.post.id).subscribe((r) => {
      this.post.totalBazes = r.totalBazes;
      this.post.utilizadorDeuBaze = r.utilizadorDeuBaze;
    });
  }

  confirmarEliminacao(): void {
    this.opcoesAbertas = false;
    this.dialogoEliminacao = true;
  }

  eliminar(): void {
    this.postService.eliminar(this.post.id).subscribe(() => {
      this.dialogoEliminacao = false;
      this.eliminado.emit(this.post.id);
    });
  }

  // Fecha o menu de opções ao clicar fora do componente
  @HostListener('document:click', ['$event'])
  fecharOpcoes(evento: MouseEvent): void {
    const alvo = evento.target as HTMLElement;
    if (!alvo.closest('.post-card__opcoes')) this.opcoesAbertas = false;
  }
}

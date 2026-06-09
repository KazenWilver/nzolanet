import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Comentario } from '../../../core/models/comment.model';
import { CommentService } from '../../../core/services/comment.service';
import { AuthService } from '../../../core/services/auth.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ReportDialogComponent } from '../report-dialog/report-dialog.component';
// Componente de item de comentário individual — usado via barrel em comments.module

@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TimeAgoPipe, UserAvatarComponent, ConfirmDialogComponent, ReportDialogComponent],
  templateUrl: './comment-item.component.html',
  styleUrl: './comment-item.component.scss'
})
export class CommentItemComponent {
  @Input({ required: true }) comentario!: Comentario;
  @Output() eliminado = new EventEmitter<number>();

  aEditar = false;
  textoEditado = '';
  dialogoEliminacao = false;
  dialogoDenuncia = false;
  denunciando = false;

  constructor(
    private commentService: CommentService,
    public authService: AuthService
  ) {}

  eMeuComentario(): boolean {
    return this.authService.obterUtilizadorAtual()?.id === this.comentario.autorId;
  }

  podeEditar(): boolean {
    return this.eMeuComentario() && this.podeEditarPorTempo();
  }

  private podeEditarPorTempo(): boolean {
    const criadoEm = new Date(this.comentario.criadoEm).getTime();
    const limiteEdicao = 1000 * 60 * 60 * 24 * 7; // 7 dias
    return Date.now() - criadoEm <= limiteEdicao;
  }

  podeEliminar(): boolean {
    const atual = this.authService.obterUtilizadorAtual();
    return this.eMeuComentario() || atual?.eAdmin === true;
  }

  iniciarEdicao(): void {
    this.textoEditado = this.comentario.texto;
    this.aEditar = true;
  }

  cancelarEdicao(): void {
    this.aEditar = false;
    this.textoEditado = '';
  }

  guardar(): void {
    if (!this.textoEditado.trim()) return;
    this.commentService.editar(this.comentario.id, { texto: this.textoEditado.trim() }).subscribe((c: Comentario) => {
      this.comentario.texto = c.texto;
      this.aEditar = false;
    });
  }

  denunciar(): void {
    this.dialogoDenuncia = true;
  }

  enviarDenuncia(motivo: string): void {
    if (this.denunciando) return;
    this.denunciando = true;
    this.commentService.denunciar(this.comentario.id, motivo).subscribe({
      next: (comentario: Comentario) => {
        this.comentario.reportsCount = comentario.reportsCount;
        this.comentario.reportadoPorMim = comentario.reportadoPorMim ?? true;
        this.dialogoDenuncia = false;
      },
      error: () => {
        // poderia mostrar erro
      },
      complete: () => {
        this.denunciando = false;
      }
    });
  }

  cancelarDenuncia(): void {
    if (this.denunciando) return;
    this.dialogoDenuncia = false;
  }

  confirmarEliminacao(): void { this.dialogoEliminacao = true; }

  eliminar(): void {
    this.commentService.eliminar(this.comentario.id).subscribe(() => {
      this.dialogoEliminacao = false;
      this.eliminado.emit(this.comentario.id);
    });
  }
}
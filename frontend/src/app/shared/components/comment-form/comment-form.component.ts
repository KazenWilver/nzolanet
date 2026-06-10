import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommentService } from '../../../core/services/comment.service';
import { Comentario } from '../../../core/models/comment.model';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
// Componente de formulário de comentário — usado via barrel em comments.module

@Component({
  selector: 'app-comment-form',
  standalone: true,
  imports: [CommonModule, FormsModule, UserAvatarComponent, LoadingSpinnerComponent],
  templateUrl: './comment-form.component.html',
  styleUrl: './comment-form.component.scss'
})
export class CommentFormComponent {
  @Input({ required: true }) postId!: number;
  @Input() fotoUtilizador?: string;
  @Input() nomeUtilizador?: string;
  @Output() comentarioCriado = new EventEmitter<Comentario>();

  texto = '';
  aEnviar = false;

  constructor(private commentService: CommentService) { }

  enviar(): void {
    if (!this.texto.trim() || this.aEnviar) return;
    this.aEnviar = true;
    this.commentService.criar({ postId: this.postId, texto: this.texto.trim() }).subscribe({
      next: (comentario: Comentario) => {
        this.comentarioCriado.emit(comentario);
        this.texto = '';
        this.aEnviar = false;
      },
      error: () => { this.aEnviar = false; }
    });
  }

  enviarComTecla(evento: Event): void {
    const teclado = evento as KeyboardEvent;
    if (!teclado.shiftKey) {
      teclado.preventDefault();
      this.enviar();
    }
  }

  ajustarAltura(evento: Event): void {
    const el = evento.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }
}
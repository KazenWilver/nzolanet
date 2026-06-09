import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostService } from '../../../core/services/post.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { Post } from '../../../core/models/post.model';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule, UserAvatarComponent, LoadingSpinnerComponent],
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.scss'
})
export class CreatePostComponent implements OnInit {
  @Output() postCriado = new EventEmitter<Post>();

  utilizadorAtual: User | null = null;
  formularioAberto = false;
  texto = '';
  ficheiroSelecionado: File | null = null;
  tipoMedia: 'imagem' | 'video' | null = null;
  previsaoUrl: string | null = null;
  aPublicar = false;

  constructor(private postService: PostService, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.utilizador$.subscribe((u: User | null) => this.utilizadorAtual = u);
  }

  abrirFormulario(): void { this.formularioAberto = true; }

  cancelar(): void {
    this.formularioAberto = false;
    this.texto = '';
    this.removerMedia();
  }

  selecionarFicheiro(evento: Event, tipo: 'imagem' | 'video'): void {
    const input = evento.target as HTMLInputElement;
    if (!input.files?.length) return;
    const ficheiro = input.files[0];
    this.ficheiroSelecionado = ficheiro;
    this.tipoMedia = tipo;
    this.previsaoUrl = URL.createObjectURL(ficheiro);
  }

  removerMedia(): void {
    if (this.previsaoUrl) URL.revokeObjectURL(this.previsaoUrl);
    this.ficheiroSelecionado = null;
    this.tipoMedia = null;
    this.previsaoUrl = null;
  }

  publicar(): void {
    if (!this.texto.trim() || this.aPublicar) return;
    this.aPublicar = true;
    const dados = {
      texto: this.texto.trim(),
      imagem: this.tipoMedia === 'imagem' ? this.ficheiroSelecionado ?? undefined : undefined,
      video:  this.tipoMedia === 'video'  ? this.ficheiroSelecionado ?? undefined : undefined
    };
    this.postService.criar(dados).subscribe({
      next: (novoPost: Post) => { this.postCriado.emit(novoPost); this.cancelar(); this.aPublicar = false; },
      error: () => { this.aPublicar = false; }
    });
  }

  ajustarAltura(evento: Event): void {
    const el = evento.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }
}
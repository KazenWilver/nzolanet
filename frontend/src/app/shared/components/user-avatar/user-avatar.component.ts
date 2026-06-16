import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-avatar.component.html',
  styleUrl: './user-avatar.component.scss'
})
export class UserAvatarComponent implements OnChanges {
  @Input() foto?: string;
  @Input() nome?: string;
  @Input() tamanho: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';

  fotoFinal?: string;
  erroImagem = false;
  imagemCarregada = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['foto']) {
      this.erroImagem = false;
      this.imagemCarregada = false;
      this.fotoFinal = this.cacheBust(this.foto);
    }
  }

  private cacheBust(url?: string): string | undefined {
    if (!url) return undefined;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${Date.now()}`;
  }

  aoCarregar(): void {
    this.imagemCarregada = true;
  }

  aoErro(): void {
    this.erroImagem = true;
    this.imagemCarregada = false;
  }

  obterIniciais(): string {
    if (!this.nome) return '?';
    return this.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }
}
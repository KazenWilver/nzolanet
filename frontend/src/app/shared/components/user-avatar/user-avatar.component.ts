import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-avatar.component.html',
  styleUrl: './user-avatar.component.scss'
})
export class UserAvatarComponent {
  @Input() foto?: string;
  @Input() nome?: string;
  @Input() tamanho: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';

  obterIniciais(): string {
    if (!this.nome) return '?';
    return this.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }
}
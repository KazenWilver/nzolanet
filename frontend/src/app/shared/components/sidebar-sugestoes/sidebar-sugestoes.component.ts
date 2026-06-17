import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface UserSuggestion {
  id: string;
  nome: string;
  nomeUtilizador: string;
  fotoPerfil?: string;
  seguidores: number;
  seguido: boolean;
}

@Component({
  selector: 'app-sidebar-sugestoes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar-sugestoes.component.html',
  styleUrl: './sidebar-sugestoes.component.scss'
})
export class SidebarSugestoesComponent {
  sugestoesAoSeguir: UserSuggestion[] = [
    { id: '1', nome: 'João Silva', nomeUtilizador: 'joaosilva', seguidores: 1234, seguido: false },
    { id: '2', nome: 'Marta Kiala', nomeUtilizador: 'martakiala', seguidores: 892, seguido: false },
    { id: '3', nome: 'Eric Dodds', nomeUtilizador: 'ericvd', seguidores: 756, seguido: false },
  ];

  tendencias = [
    { hashtag: '#techangola', posts: '1,234' },
    { hashtag: '#isptec', posts: '892' },
    { hashtag: '#startups', posts: '756' },
    { hashtag: '#opensource', posts: '512' },
    { hashtag: '#uxresearch', posts: '432' },
  ];

  constructor(private router: Router) {}

  seguir(userId: string): void {
    const user = this.sugestoesAoSeguir.find((item) => item.id === userId);
    if (user) {
      user.seguido = !user.seguido;
    }
  }

  getInitials(nome: string): string {
    return nome.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  pesquisarHashtag(hashtag: string): void {
    const query = hashtag.startsWith('#') ? hashtag.slice(1) : hashtag;
    this.router.navigate(['/pesquisar'], { queryParams: { q: query } });
  }
}

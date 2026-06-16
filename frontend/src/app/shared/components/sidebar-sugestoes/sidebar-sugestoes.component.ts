import { Component, OnInit } from '@angular/core';
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
export class SidebarSugestoesComponent implements OnInit {
  sugestoesAoSeguir: UserSuggestion[] = [
    {
      id: '1',
      nome: 'João Silva',
      nomeUtilizador: 'joaosilva',
      seguidores: 1234,
      fotoPerfil: undefined,
      seguido: false
    },
    {
      id: '2',
      nome: 'Maria Santos',
      nomeUtilizador: 'mariasantos',
      seguidores: 5678,
      fotoPerfil: undefined,
      seguido: false
    },
    {
      id: '3',
      nome: 'Pedro Costa',
      nomeUtilizador: 'pedrocosta',
      seguidores: 3456,
      fotoPerfil: undefined,
      seguido: false
    },
  ];

  tendencias = [
    { hashtag: '#LuandoTech', posts: '30K' },
    { hashtag: '#StartupAngola', posts: '15K' },
    { hashtag: '#Desenvolvimento', posts: '8.5K' },
    { hashtag: '#Inovação', posts: '12K' },
    { hashtag: '#Tech', posts: '125K' },
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  seguir(userId: string): void {
    const user = this.sugestoesAoSeguir.find((item) => item.id === userId);
    if (!user) {
      return;
    }
    user.seguido = !user.seguido;
  }

  visitarPerfil(userId: string): void {
    this.router.navigate(['/perfil', userId]);
  }

  getInitials(nome: string): string {
    return nome.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  pesquisarHashtag(hashtag: string): void {
    const query = hashtag.startsWith('#') ? hashtag.slice(1) : hashtag;
    this.router.navigate(['/pesquisar'], { queryParams: { q: query } });
  }
}

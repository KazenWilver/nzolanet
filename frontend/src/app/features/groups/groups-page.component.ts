import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Grupo {
  id: string;
  nome: string;
  descricao: string;
  membros: number;
  seguido: boolean;
}

@Component({
  selector: 'app-groups-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './groups-page.component.html',
  styleUrl: './groups-page.component.scss'
})
export class GroupsPageComponent {
  grupos: Grupo[] = [
    { id: '1', nome: 'Comunidade NzolaNet', descricao: 'Partilha notícias, ideias e dicas com membros activos.', membros: 1240, seguido: true },
    { id: '2', nome: 'Criadores de Conteúdo', descricao: 'Grupos para quem publica fotos, vídeos e textos regularmente.', membros: 870, seguido: false },
    { id: '3', nome: 'Tecnologia e Inovação', descricao: 'Discussões sobre inovação digital e aplicações modernas.', membros: 532, seguido: false }
  ];

  alternarSeguir(grupo: Grupo): void {
    grupo.seguido = !grupo.seguido;
  }
}

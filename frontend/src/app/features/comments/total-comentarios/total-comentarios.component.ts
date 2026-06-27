import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommentService } from '../../../core/services/comment.service';
import { Comentario } from '../../../core/models/comment.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-total-comentarios',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, RouterLink],
  templateUrl: './total-comentarios.component.html',
  styleUrl: './total-comentarios.component.scss'
})
export class TotalComentariosComponent implements OnInit {
  totalComentarios = 0;
  comentariosRecentes: Comentario[] = [];
  aCarregar = true;

  constructor(private commentService: CommentService) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.aCarregar = true;
    
    // Obter o total de comentários
    this.commentService.obterTotalComentarios().subscribe({
      next: (total) => {
        this.totalComentarios = total;
        
        // Depois carregar os comentários recentes para mostrar na listagem
        this.commentService.obterTodos().subscribe({
          next: (lista) => {
            this.comentariosRecentes = lista.slice(0, 5); // Mostra apenas os 5 mais recentes
            this.aCarregar = false;
          },
          error: () => {
            this.aCarregar = false;
          }
        });
      },
      error: () => {
        this.aCarregar = false;
      }
    });
  }
}

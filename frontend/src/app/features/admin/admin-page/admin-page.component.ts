import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AdminService, AdminMetrics, ComentarioReportado } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.scss']
})
export class AdminPageComponent implements OnInit {
  carregandoMetrics = false;
  carregandoComentarios = false;
  carregandoRemocao = false;
  erroMetrics = '';
  erroComentarios = '';
  mensagemSucesso = '';
  metrics: AdminMetrics | null = null;
  comentarios: ComentarioReportado[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.atualizarDashboard();
  }

  atualizarDashboard(): void {
    this.mensagemSucesso = '';
    this.carregarMetrics();
    this.carregarComentariosDenunciados();
  }

  carregarMetrics(): void {
    this.carregandoMetrics = true;
    this.erroMetrics = '';
    this.adminService.obterMetricas().subscribe({
      next: (dados) => { this.metrics = dados; },
      error: () => { this.erroMetrics = 'Não foi possível carregar os indicadores.'; },
      complete: () => { this.carregandoMetrics = false; }
    });
  }

  carregarComentariosDenunciados(): void {
    this.carregandoComentarios = true;
    this.erroComentarios = '';
    this.adminService.obterComentariosDenunciados().subscribe({
      next: (dados) => { this.comentarios = dados; },
      error: () => { this.erroComentarios = 'Não foi possível carregar os comentários denunciados.'; },
      complete: () => { this.carregandoComentarios = false; }
    });
  }

  confirmarRemoverComentario(comentario: ComentarioReportado): void {
    const confirma = window.confirm(`Remover o comentário de ${comentario.autorNome} e todos os relatórios associados?`);
    if (!confirma) {
      return;
    }

    this.removerComentario(comentario.id);
  }

  removerComentario(id: string): void {
    this.carregandoRemocao = true;
    this.erroComentarios = '';
    this.mensagemSucesso = '';

    this.adminService.removerComentario(id).subscribe({
      next: () => {
        this.comentarios = this.comentarios.filter((comentario) => comentario.id !== id);
        if (this.metrics) {
          this.metrics.totalComentarios = Math.max(0, this.metrics.totalComentarios - 1);
          this.metrics.totalComentariosDenunciados = Math.max(0, this.metrics.totalComentariosDenunciados - 1);
        }
        this.mensagemSucesso = 'Comentário apagado com sucesso.';
      },
      error: () => {
        this.erroComentarios = 'Não foi possível apagar o comentário. Tente novamente mais tarde.';
      },
      complete: () => {
        this.carregandoRemocao = false;
      }
    });
  }
}

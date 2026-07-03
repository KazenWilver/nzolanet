import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  AdminMetrics,
  AdminService,
  AdminUserRow,
  ReportedComment,
  ReportedPublication
} from '../../../core/services/admin.service';

type AdminTab = 'comentarios' | 'publicacoes' | 'utilizadores';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);

  activeTab: AdminTab = 'comentarios';

  metrics: AdminMetrics | null = null;
  reportedComments: ReportedComment[] = [];
  reportedPublications: ReportedPublication[] = [];
  users: AdminUserRow[] = [];

  loadingMetrics = false;
  loadingComments = false;
  loadingPublications = false;
  loadingUsers = false;
  processingId: string | null = null;

  errorMessage = '';
  successMessage = '';

  get regularUsers(): AdminUserRow[] {
    return this.users.filter(user => user.role !== 'Admin');
  }

  get adminUsers(): AdminUserRow[] {
    return this.users.filter(user => user.role === 'Admin');
  }

  ngOnInit(): void {
    this.loadMetrics();
    this.loadReportedComments();
    this.loadReportedPublications();
    this.loadUsers();
  }

  handleSelectTab(tab: AdminTab): void {
    this.activeTab = tab;
  }

  handleRefresh(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.loadMetrics();
    this.loadReportedComments();
    this.loadReportedPublications();
    this.loadUsers();
  }

  loadMetrics(): void {
    this.loadingMetrics = true;
    this.adminService
      .obterMetricas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: metrics => {
          this.metrics = metrics;
          this.loadingMetrics = false;
        },
        error: () => {
          this.loadingMetrics = false;
          this.errorMessage = 'Não foi possível carregar os indicadores.';
        }
      });
  }

  loadReportedComments(): void {
    this.loadingComments = true;
    this.adminService
      .obterComentariosDenunciados()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: comments => {
          this.reportedComments = comments;
          this.loadingComments = false;
        },
        error: () => {
          this.loadingComments = false;
          this.errorMessage = 'Não foi possível carregar os comentários denunciados.';
        }
      });
  }

  loadReportedPublications(): void {
    this.loadingPublications = true;
    this.adminService
      .obterPublicacoesDenunciadas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: publications => {
          this.reportedPublications = publications;
          this.loadingPublications = false;
        },
        error: () => {
          this.loadingPublications = false;
          this.errorMessage = 'Não foi possível carregar as publicações denunciadas.';
        }
      });
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.adminService
      .obterUtilizadores()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: users => {
          this.users = users;
          this.loadingUsers = false;
        },
        error: () => {
          this.loadingUsers = false;
          this.errorMessage = 'Não foi possível carregar os utilizadores.';
        }
      });
  }

  handleRemoveComment(comment: ReportedComment): void {
    const confirmed = window.confirm(
      `Remover o comentário de ${comment.autorNome} e todas as denúncias associadas?`
    );
    if (!confirmed) {
      return;
    }

    this.startAction(comment.id);
    this.adminService
      .removerComentario(comment.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reportedComments = this.reportedComments.filter(item => item.id !== comment.id);
          this.finishAction('Comentário removido com sucesso.');
          this.loadMetrics();
        },
        error: () => this.failAction('Não foi possível remover o comentário.')
      });
  }

  handleDismissComment(comment: ReportedComment): void {
    this.startAction(comment.id);
    this.adminService
      .ignorarDenunciasComentario(comment.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reportedComments = this.reportedComments.filter(item => item.id !== comment.id);
          this.finishAction('Denúncias do comentário ignoradas.');
          this.loadMetrics();
        },
        error: () => this.failAction('Não foi possível ignorar as denúncias.')
      });
  }

  handleRemovePublication(publication: ReportedPublication): void {
    const confirmed = window.confirm(
      `Remover a publicação de ${publication.donoNome} e todas as denúncias associadas?`
    );
    if (!confirmed) {
      return;
    }

    this.startAction(publication.id);
    this.adminService
      .removerPublicacao(publication.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reportedPublications = this.reportedPublications.filter(item => item.id !== publication.id);
          this.finishAction('Publicação removida com sucesso.');
          this.loadMetrics();
        },
        error: () => this.failAction('Não foi possível remover a publicação.')
      });
  }

  handleDismissPublication(publication: ReportedPublication): void {
    this.startAction(publication.id);
    this.adminService
      .ignorarDenunciasPublicacao(publication.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reportedPublications = this.reportedPublications.filter(item => item.id !== publication.id);
          this.finishAction('Denúncias da publicação ignoradas.');
          this.loadMetrics();
        },
        error: () => this.failAction('Não foi possível ignorar as denúncias.')
      });
  }

  private startAction(id: string): void {
    this.processingId = id;
    this.errorMessage = '';
    this.successMessage = '';
  }

  private finishAction(message: string): void {
    this.processingId = null;
    this.successMessage = message;
  }

  private failAction(message: string): void {
    this.processingId = null;
    this.errorMessage = message;
  }
}

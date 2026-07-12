import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { CommonModule } from '@angular/common'
import { forkJoin, finalize } from 'rxjs'
import {
  AdminMetrics,
  AdminService,
  AdminUserRow,
  ReportedComment,
  ReportedPublication
} from '../../../core/services/admin.service'
import { AdminRealtimeService } from '../../../core/services/admin-realtime.service'
import { AdminMetricsChartsComponent } from '../admin-metrics-charts/admin-metrics-charts.component'

type AdminMainView = 'indicadores' | 'graficos' | 'moderacao'
type AdminTab = 'comentarios' | 'publicacoes' | 'utilizadores'

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, AdminMetricsChartsComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private readonly adminService = inject(AdminService)
  private readonly adminRealtime = inject(AdminRealtimeService)
  private readonly destroyRef = inject(DestroyRef)

  mainView: AdminMainView = 'indicadores'
  activeTab: AdminTab = 'comentarios'

  metrics: AdminMetrics | null = null
  reportedComments: ReportedComment[] = []
  reportedPublications: ReportedPublication[] = []
  users: AdminUserRow[] = []

  loadingMetrics = false
  loadingComments = false
  loadingPublications = false
  loadingUsers = false
  refreshing = false
  processingId: string | null = null

  errorMessage = ''
  successMessage = ''
  lastUpdatedAt: Date | null = null
  private latestPresenceMetrics: { totalUtilizadoresOnline: number; totalUtilizadoresOffline: number } | null = null

  get regularUsers(): AdminUserRow[] {
    return this.users.filter(user => user.role !== 'Admin')
  }

  get adminUsers(): AdminUserRow[] {
    return this.users.filter(user => user.role === 'Admin')
  }

  ngOnInit(): void {
    this.handleRefresh()
    void this.adminRealtime.connect()

    this.adminRealtime.presenceMetrics$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        this.latestPresenceMetrics = event
        this.applyPresenceMetrics(event)
      })
  }

  ngOnDestroy(): void {
    void this.adminRealtime.disconnect()
  }

  handleSelectMainView(view: AdminMainView): void {
    this.mainView = view
  }

  handleSelectTab(tab: AdminTab): void {
    this.activeTab = tab
    this.mainView = 'moderacao'
  }

  handleRefresh(): void {
    this.successMessage = ''
    this.errorMessage = ''
    this.refreshing = true
    this.loadingMetrics = this.metrics === null
    this.loadingComments = this.reportedComments.length === 0
    this.loadingPublications = this.reportedPublications.length === 0
    this.loadingUsers = this.users.length === 0

    forkJoin({
      metrics: this.adminService.obterMetricas(),
      comments: this.adminService.obterComentariosDenunciados(),
      publications: this.adminService.obterPublicacoesDenunciadas(),
      users: this.adminService.obterUtilizadores()
    })
      .pipe(
        finalize(() => {
          this.refreshing = false
          this.loadingMetrics = false
          this.loadingComments = false
          this.loadingPublications = false
          this.loadingUsers = false
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ metrics, comments, publications, users }) => {
          this.metrics = metrics
          this.reportedComments = comments
          this.reportedPublications = publications
          this.users = users
          this.applyPresenceMetrics(this.latestPresenceMetrics)
          this.lastUpdatedAt = new Date()
        },
        error: () => {
          this.errorMessage = 'Não foi possível actualizar os dados do painel.'
        }
      })
  }

  handleRemoveComment(comment: ReportedComment): void {
    const confirmed = window.confirm(
      `Remover o comentário de ${comment.autorNome} e todas as denúncias associadas?`
    )
    if (!confirmed) {
      return
    }

    this.startAction(comment.id)
    this.adminService
      .removerComentario(comment.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reportedComments = this.reportedComments.filter(item => item.id !== comment.id)
          this.finishAction('Comentário removido com sucesso.')
          this.loadMetricsOnly()
        },
        error: () => this.failAction('Não foi possível remover o comentário.')
      })
  }

  handleDismissComment(comment: ReportedComment): void {
    this.startAction(comment.id)
    this.adminService
      .ignorarDenunciasComentario(comment.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reportedComments = this.reportedComments.filter(item => item.id !== comment.id)
          this.finishAction('Denúncias do comentário ignoradas.')
          this.loadMetricsOnly()
        },
        error: () => this.failAction('Não foi possível ignorar as denúncias.')
      })
  }

  handleRemovePublication(publication: ReportedPublication): void {
    const confirmed = window.confirm(
      `Remover a publicação de ${publication.donoNome} e todas as denúncias associadas?`
    )
    if (!confirmed) {
      return
    }

    this.startAction(publication.id)
    this.adminService
      .removerPublicacao(publication.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reportedPublications = this.reportedPublications.filter(item => item.id !== publication.id)
          this.finishAction('Publicação removida com sucesso.')
          this.loadMetricsOnly()
        },
        error: () => this.failAction('Não foi possível remover a publicação.')
      })
  }

  handleDismissPublication(publication: ReportedPublication): void {
    this.startAction(publication.id)
    this.adminService
      .ignorarDenunciasPublicacao(publication.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reportedPublications = this.reportedPublications.filter(item => item.id !== publication.id)
          this.finishAction('Denúncias da publicação ignoradas.')
          this.loadMetricsOnly()
        },
        error: () => this.failAction('Não foi possível ignorar as denúncias.')
      })
  }

  private loadMetricsOnly(): void {
    this.adminService
      .obterMetricas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: metrics => {
          this.metrics = metrics
          this.applyPresenceMetrics(this.latestPresenceMetrics)
          this.lastUpdatedAt = new Date()
        }
      })
  }

  private startAction(id: string): void {
    this.processingId = id
    this.errorMessage = ''
    this.successMessage = ''
  }

  private finishAction(message: string): void {
    this.processingId = null
    this.successMessage = message
  }

  private failAction(message: string): void {
    this.processingId = null
    this.errorMessage = message
  }

  private applyPresenceMetrics(
    metrics: { totalUtilizadoresOnline: number; totalUtilizadoresOffline: number } | null
  ): void {
    if (!this.metrics || !metrics) {
      return
    }

    this.metrics = {
      ...this.metrics,
      totalUtilizadoresOnline: metrics.totalUtilizadoresOnline,
      totalUtilizadoresOffline: metrics.totalUtilizadoresOffline
    }
    this.lastUpdatedAt = new Date()
  }
}

import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from '@angular/core'
import { CommonModule } from '@angular/common'
import Chart from 'chart.js/auto'
import type { AdminMetrics } from '../../../core/services/admin.service'

@Component({
  selector: 'app-admin-metrics-charts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-metrics-charts.component.html',
  styleUrl: './admin-metrics-charts.component.scss'
})
export class AdminMetricsChartsComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) metrics!: AdminMetrics

  @ViewChild('presenceChart') presenceChartRef?: ElementRef<HTMLCanvasElement>
  @ViewChild('engagementChart') engagementChartRef?: ElementRef<HTMLCanvasElement>
  @ViewChild('contentChart') contentChartRef?: ElementRef<HTMLCanvasElement>
  @ViewChild('hashtagsChart') hashtagsChartRef?: ElementRef<HTMLCanvasElement>
  @ViewChild('followersChart') followersChartRef?: ElementRef<HTMLCanvasElement>
  @ViewChild('fimbuChart') fimbuChartRef?: ElementRef<HTMLCanvasElement>

  private charts: Chart[] = []
  private viewReady = false

  ngAfterViewInit(): void {
    this.viewReady = true
    this.renderCharts()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['metrics'] && this.viewReady) {
      this.renderCharts()
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts()
  }

  private renderCharts(): void {
    if (!this.metrics) {
      return
    }

    this.destroyCharts()

    this.createPresenceChart()
    this.createEngagementChart()
    this.createContentChart()
    this.createHashtagsChart()
    this.createFollowersChart()
    this.createFimbuChart()
  }

  private createPresenceChart(): void {
    const canvas = this.presenceChartRef?.nativeElement
    if (!canvas) {
      return
    }

    this.charts.push(new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Online', 'Offline'],
        datasets: [{
          data: [this.metrics.totalUtilizadoresOnline, this.metrics.totalUtilizadoresOffline],
          backgroundColor: ['#22c55e', '#64748b'],
          borderWidth: 0
        }]
      },
      options: this.doughnutOptions('Presença de contas')
    }))
  }

  private createEngagementChart(): void {
    const canvas = this.engagementChartRef?.nativeElement
    if (!canvas) {
      return
    }

    this.charts.push(new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Publicações', 'Comentários', 'Bazes'],
        datasets: [{
          label: 'Total',
          data: [this.metrics.totalPublicacoes, this.metrics.totalComentarios, this.metrics.totalBazes],
          backgroundColor: ['#38bdf8', '#a78bfa', '#f472b6'],
          borderRadius: 8
        }]
      },
      options: this.barOptions('Engajamento na plataforma')
    }))
  }

  private createContentChart(): void {
    const canvas = this.contentChartRef?.nativeElement
    if (!canvas) {
      return
    }

    this.charts.push(new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Fotografias', 'Vídeos', 'Hashtags'],
        datasets: [{
          data: [
            this.metrics.totalFotografiasPartilhadas,
            this.metrics.totalVideosPartilhados,
            this.metrics.totalHashtagsCriadas
          ],
          backgroundColor: ['#f59e0b', '#ef4444', '#14b8a6'],
          borderWidth: 0
        }]
      },
      options: this.doughnutOptions('Conteúdo multimédia')
    }))
  }

  private createHashtagsChart(): void {
    const canvas = this.hashtagsChartRef?.nativeElement
    if (!canvas) {
      return
    }

    const top = this.metrics.topHashtags.slice(0, 8)
    this.charts.push(new Chart(canvas, {
      type: 'bar',
      data: {
        labels: top.map(item => `#${item.tag}`),
        datasets: [{
          label: 'Utilizações',
          data: top.map(item => item.totalUtilizacoes),
          backgroundColor: '#38bdf8',
          borderRadius: 8
        }]
      },
      options: this.horizontalBarOptions('Top hashtags')
    }))
  }

  private createFollowersChart(): void {
    const canvas = this.followersChartRef?.nativeElement
    if (!canvas) {
      return
    }

    const top = this.metrics.topPerfisSeguidos.slice(0, 8)
    this.charts.push(new Chart(canvas, {
      type: 'bar',
      data: {
        labels: top.map(item => item.nomeUtilizador),
        datasets: [{
          label: 'Seguidores',
          data: top.map(item => item.totalSeguidores),
          backgroundColor: '#a78bfa',
          borderRadius: 8
        }]
      },
      options: this.horizontalBarOptions('Perfis mais seguidos')
    }))
  }

  private createFimbuChart(): void {
    const canvas = this.fimbuChartRef?.nativeElement
    if (!canvas) {
      return
    }

    const top = this.metrics.topUtilizadoresFimbu.slice(0, 8)
    this.charts.push(new Chart(canvas, {
      type: 'bar',
      data: {
        labels: top.map(item => item.nomeUtilizador),
        datasets: [{
          label: 'Interações',
          data: top.map(item => item.totalInteracoes),
          backgroundColor: '#f472b6',
          borderRadius: 8
        }]
      },
      options: this.horizontalBarOptions('Utilizadores mais ativos na Fimbu')
    }))
  }

  private doughnutOptions(title: string): Chart['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#cbd5e1' } },
        title: { display: true, text: title, color: '#f8fafc', font: { size: 14, weight: 'bold' } }
      }
    }
  }

  private barOptions(title: string): Chart['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: title, color: '#f8fafc', font: { size: 14, weight: 'bold' } }
      },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.12)' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.12)' }, beginAtZero: true }
      }
    }
  }

  private horizontalBarOptions(title: string): Chart['options'] {
    return {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: title, color: '#f8fafc', font: { size: 14, weight: 'bold' } }
      },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.12)' }, beginAtZero: true },
        y: { ticks: { color: '#94a3b8' }, grid: { display: false } }
      }
    }
  }

  private destroyCharts(): void {
    for (const chart of this.charts) {
      chart.destroy()
    }

    this.charts = []
  }
}

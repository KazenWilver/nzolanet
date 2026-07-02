import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private readonly filtrosStorageKey = 'nzolanet.admin.dashboard.filtros.v1'
  private readonly filtrosAtualizadosEventName = 'nzolanet-admin-filtros-atualizados'
  readonly navigationItems = [
    { id: 'secao-visao-geral', label: 'Visão geral' },
    { id: 'secao-metricas', label: 'Métricas' },
    { id: 'secao-rankings', label: 'Rankings' },
    { id: 'secao-publicacoes-denunciadas', label: 'Denúncias de publicações' },
    { id: 'secao-comentarios-denunciados', label: 'Denúncias de comentários' }
  ]
  secaoAtiva = 'secao-visao-geral'
  periodoRankingAtivo: '24h' | '7d' | '30d' = '30d'
  private scrollSpyRaf: number | null = null
  private readonly handleScrollSpy = () => {
    this.executarScrollSpy()
  }
  private readonly handleFiltrosAtualizados = () => {
    this.atualizarPeriodoRankingAtivo()
  }

  constructor(
    private authService: AuthService,
    readonly themeService: ThemeService
  ) {}

  ngOnInit(): void {
    if (typeof window === 'undefined') {
      return
    }

    window.addEventListener('scroll', this.handleScrollSpy, { passive: true })
    window.addEventListener('resize', this.handleScrollSpy, { passive: true })
    window.addEventListener('hashchange', this.handleScrollSpy)
    window.addEventListener(this.filtrosAtualizadosEventName, this.handleFiltrosAtualizados)
    window.addEventListener('storage', this.handleFiltrosAtualizados)
    this.atualizarPeriodoRankingAtivo()
    this.executarScrollSpy()
  }

  ngOnDestroy(): void {
    if (typeof window === 'undefined') {
      return
    }

    window.removeEventListener('scroll', this.handleScrollSpy)
    window.removeEventListener('resize', this.handleScrollSpy)
    window.removeEventListener('hashchange', this.handleScrollSpy)
    window.removeEventListener(this.filtrosAtualizadosEventName, this.handleFiltrosAtualizados)
    window.removeEventListener('storage', this.handleFiltrosAtualizados)
    if (this.scrollSpyRaf !== null) {
      cancelAnimationFrame(this.scrollSpyRaf)
      this.scrollSpyRaf = null
    }
  }

  isSecaoAtiva(secaoId: string): boolean {
    return this.secaoAtiva === secaoId
  }

  handleIrParaSecao(secaoId: string): void {
    this.secaoAtiva = secaoId
    this.executarScrollSpy()
  }

  handleLogout(): void {
    this.authService.logout();
  }

  handleToggleTheme(): void {
    this.themeService.toggleTheme();
  }

  private executarScrollSpy(): void {
    if (typeof window === 'undefined') {
      return
    }

    if (this.scrollSpyRaf !== null) {
      return
    }

    this.scrollSpyRaf = requestAnimationFrame(() => {
      this.scrollSpyRaf = null
      const cutoff = 160
      const secoesVisiveis = this.navigationItems
        .map(item => document.getElementById(item.id))
        .filter((element): element is HTMLElement => !!element && this.isElementoVisivel(element))

      if (!secoesVisiveis.length) {
        return
      }

      const secaoEmFoco = secoesVisiveis.find(secao => {
        const rect = secao.getBoundingClientRect()
        return rect.top <= cutoff && rect.bottom > cutoff
      })

      if (secaoEmFoco?.id) {
        this.secaoAtiva = secaoEmFoco.id
        return
      }

      const secaoMaisProxima = secoesVisiveis
        .map(secao => ({ id: secao.id, distancia: Math.abs(secao.getBoundingClientRect().top - cutoff) }))
        .sort((a, b) => a.distancia - b.distancia)[0]

      if (secaoMaisProxima?.id) {
        this.secaoAtiva = secaoMaisProxima.id
      }
    })
  }

  private isElementoVisivel(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element)
    return style.display !== 'none' && style.visibility !== 'hidden'
  }

  private atualizarPeriodoRankingAtivo(): void {
    if (typeof window === 'undefined') {
      return
    }

    const raw = window.localStorage.getItem(this.filtrosStorageKey)
    if (!raw) {
      this.periodoRankingAtivo = '30d'
      return
    }

    try {
      const parsed = JSON.parse(raw) as { periodoRanking?: unknown }
      this.periodoRankingAtivo = this.normalizarPeriodoRanking(parsed.periodoRanking)
    } catch {
      this.periodoRankingAtivo = '30d'
    }
  }

  private normalizarPeriodoRanking(valor: unknown): '24h' | '7d' | '30d' {
    if (valor === '24h' || valor === '7d' || valor === '30d') {
      return valor
    }

    return '30d'
  }
}

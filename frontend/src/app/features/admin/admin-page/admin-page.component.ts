import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminRankingPeriod,
  AdminMetrics,
  AdminService,
  ComentarioReportado,
  PublicacaoDenunciada
} from '../../../core/services/admin.service';
import { AdminRealtimeConnectionState, AdminRealtimeService } from '../../../core/services/admin-realtime.service';
import { resolveMediaUrl } from '../../../core/helpers/media-url.helper';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.scss']
})
export class AdminPageComponent implements OnInit, OnDestroy {
  private readonly ordemAnimacaoMetricas: Array<keyof AdminMetrics> = [
    'totalUtilizadores',
    'totalUtilizadoresOnline',
    'totalUtilizadoresOffline',
    'totalGrupos',
    'totalGruposApagados',
    'totalPublicacoes',
    'totalHashtagsCriadas',
    'totalPublicacoesDenunciadas',
    'totalComentariosDenunciados',
    'totalMensagensEnviadas',
    'totalMensagensRecebidas',
    'totalInteracoesIa',
    'totalMensagensIa',
    'totalDenuncias',
    'totalBazes',
    'mediaUtilizadoresOnlinePercentagem',
    'mediaUtilizadoresOfflinePercentagem',
    'mediaUsoIaPercentagem'
  ]
  private readonly categoriasVelocidade: Record<string, 'normal' | 'warning' | 'ia'> = {
    totalPublicacoesDenunciadas: 'warning',
    totalComentariosDenunciados: 'warning',
    totalDenuncias: 'warning',
    totalInteracoesIa: 'ia',
    totalMensagensIa: 'ia',
    mediaUsoIaPercentagem: 'ia'
  }
  private readonly multiplicadorVelocidade: Record<'normal' | 'warning' | 'ia', number> = {
    normal: 1,
    warning: 0.82,
    ia: 1.18
  }
  private readonly adminService = inject(AdminService);
  private readonly adminRealtimeService = inject(AdminRealtimeService);
  private readonly destroyRef = inject(DestroyRef);
  private metricsAnimationFrame: number | null = null

  carregandoDashboard = false;
  carregandoMetrics = true;
  carregandoComentarios = true;
  carregandoPublicacoes = true;
  carregandoAcao = false;

  erroMetrics = '';
  erroComentarios = '';
  erroPublicacoes = '';
  mensagemSucesso = '';
  ultimaAtualizacao: Date | null = null;

  metrics: AdminMetrics | null = null;
  metricsAnimadas: AdminMetrics | null = null
  comentarios: ComentarioReportado[] = [];
  publicacoes: PublicacaoDenunciada[] = [];
  cardsMorphState = false
  filtroVistaRapida: 'all' | 'metricas' | 'rankings' | 'denuncias' = 'all'
  filtroDenuncias: 'all' | 'criticas' = 'all'
  buscaDenuncias = ''
  filtroMotivoDenuncia = 'all'
  filtroTipoMediaPublicacao: 'all' | 'texto' | 'com-media' | 'imagem' | 'video' = 'all'
  ordenacaoPublicacoes: 'reports-desc' | 'reports-asc' | 'recentes' | 'antigas' = 'reports-desc'
  ordenacaoComentarios: 'reports-desc' | 'reports-asc' | 'recentes' | 'antigas' = 'reports-desc'
  buscaRanking = ''
  ordenacaoHashtags: 'usos-desc' | 'usos-asc' | 'nome-asc' | 'nome-desc' = 'usos-desc'
  ordenacaoPerfis: 'seguidores-desc' | 'seguidores-asc' | 'nome-asc' | 'nome-desc' = 'seguidores-desc'
  paginaHashtags = 1
  paginaPerfis = 1
  tamanhoPaginaTabela = 5
  estadoRealtime: AdminRealtimeConnectionState = 'offline'
  periodoRanking: AdminRankingPeriod = '30d'

  ngOnInit(): void {
    this.atualizarDashboard()
    this.ligarAtualizacaoSignalR()
  }

  ngOnDestroy(): void {
    if (this.metricsAnimationFrame !== null) {
      cancelAnimationFrame(this.metricsAnimationFrame)
      this.metricsAnimationFrame = null
    }
  }

  atualizarDashboard(): void {
    if (this.carregandoDashboard) {
      return;
    }

    this.carregandoDashboard = true;
    this.mensagemSucesso = '';

    this.carregarMetrics(() => {
      this.carregandoDashboard = false;
      this.ultimaAtualizacao = new Date();
    });

    this.carregarComentariosDenunciados();
    this.carregarPublicacoesDenunciadas();
  }

  private ligarAtualizacaoSignalR(): void {
    this.adminRealtimeService
      .connectionState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(estado => {
        this.estadoRealtime = estado
      })

    this.adminRealtimeService
      .metricsUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.carregarMetrics(() => {
          this.ultimaAtualizacao = new Date()
        })
      })

    this.adminRealtimeService
      .reportsUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.carregarComentariosDenunciados()
        this.carregarPublicacoesDenunciadas()
        this.carregarMetrics(() => {
          this.ultimaAtualizacao = new Date()
        })
      })

    this.adminRealtimeService
      .connect()
      .catch(() => {
        this.erroMetrics = 'Não foi possível iniciar a ligação realtime do painel admin.'
      })
  }

  obterTextoEstadoRealtime(): string {
    if (this.estadoRealtime === 'connected') {
      return 'Ligado'
    }

    if (this.estadoRealtime === 'reconnecting') {
      return 'Reconectar'
    }

    return 'Offline'
  }

  carregarMetrics(onDone?: () => void): void {
    this.carregandoMetrics = true
    this.erroMetrics = '';
    this.adminService
      .obterMetricas(this.periodoRanking)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: dados => {
          this.metrics = dados
          this.aplicarTransicaoMetricas(dados)
        },
        error: () => {
          this.erroMetrics = 'Não foi possível carregar os indicadores em tempo real.';
          this.carregandoDashboard = false;
          onDone?.();
        },
        complete: () => {
          this.carregandoMetrics = false
          onDone?.();
        }
      });
  }

  carregarComentariosDenunciados(): void {
    this.carregandoComentarios = true
    this.erroComentarios = '';
    this.adminService
      .obterComentariosDenunciados()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: dados => {
          this.comentarios = dados;
        },
        error: () => {
          this.erroComentarios = 'Não foi possível carregar comentários denunciados.';
        },
        complete: () => {
          this.carregandoComentarios = false
        }
      });
  }

  carregarPublicacoesDenunciadas(): void {
    this.carregandoPublicacoes = true
    this.erroPublicacoes = '';
    this.adminService
      .obterPublicacoesDenunciadas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: dados => {
          this.publicacoes = dados;
        },
        error: () => {
          this.erroPublicacoes = 'Não foi possível carregar publicações denunciadas.';
        },
        complete: () => {
          this.carregandoPublicacoes = false
        }
      });
  }

  confirmarRemoverComentario(comentario: ComentarioReportado): void {
    const confirma = window.confirm(`Remover o comentário de ${comentario.autorNome} e todas as denúncias associadas?`);
    if (!confirma) {
      return;
    }

    this.removerComentario(comentario.id);
  }

  removerComentario(id: string): void {
    this.carregandoAcao = true;
    this.erroComentarios = '';
    this.mensagemSucesso = '';

    this.adminService
      .removerComentario(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.comentarios = this.comentarios.filter(comentario => comentario.id !== id)
          this.mensagemSucesso = 'Comentário apagado com sucesso.'
          this.atualizarDashboard()
        },
        error: () => {
          this.erroComentarios = 'Não foi possível apagar o comentário. Tente novamente mais tarde.'
        },
        complete: () => {
          this.carregandoAcao = false
        }
      })
  }

  confirmarRemoverPublicacao(publicacao: PublicacaoDenunciada): void {
    const confirma = window.confirm(`Apagar definitivamente a publicação de ${publicacao.donoNome}? Esta ação remove da base de dados.`);
    if (!confirma) {
      return;
    }

    this.removerPublicacao(publicacao.id);
  }

  removerPublicacao(id: string): void {
    this.carregandoAcao = true;
    this.erroPublicacoes = '';
    this.mensagemSucesso = '';

    this.adminService
      .removerPublicacao(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.publicacoes = this.publicacoes.filter(publicacao => publicacao.id !== id);
          this.mensagemSucesso = 'Publicação removida com sucesso.'
          this.atualizarDashboard()
        },
        error: () => {
          this.erroPublicacoes = 'Não foi possível apagar a publicação.'
        },
        complete: () => {
          this.carregandoAcao = false
        }
      })
  }

  manterPublicacao(publicacao: PublicacaoDenunciada): void {
    this.carregandoAcao = true;
    this.erroPublicacoes = '';
    this.mensagemSucesso = '';

    this.adminService
      .manterPublicacao(publicacao.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.publicacoes = this.publicacoes.filter(item => item.id !== publicacao.id);
          this.mensagemSucesso = 'Publicação marcada como não ofensiva.'
          this.atualizarDashboard()
        },
        error: () => {
          this.erroPublicacoes = 'Não foi possível manter a publicação neste momento.'
        },
        complete: () => {
          this.carregandoAcao = false
        }
      })
  }

  obterPercentagemOnline(): number {
    const metrics = this.metricsAnimadas ?? this.metrics
    if (!metrics || metrics.totalUtilizadores === 0) {
      return 0
    }

    return Math.round((metrics.totalUtilizadoresOnline * 100) / metrics.totalUtilizadores)
  }

  obterPercentagemOffline(): number {
    const metrics = this.metricsAnimadas ?? this.metrics
    if (!metrics || metrics.totalUtilizadores === 0) {
      return 0
    }

    return Math.round((metrics.totalUtilizadoresOffline * 100) / metrics.totalUtilizadores)
  }

  obterMediaIaPercentagem(): number {
    const metrics = this.metricsAnimadas ?? this.metrics
    return Math.max(0, Math.min(100, Math.round(metrics?.mediaUsoIaPercentagem ?? 0)))
  }

  obterTopHashtags(): Array<{ hashtag: string; usos: number }> {
    return (this.metricsAnimadas ?? this.metrics)?.topHashtagsMaisUsadas ?? []
  }

  obterTopPerfisSeguidos(): Array<{ userId: string; nome: string; nomeUtilizador: string; fotoPerfil?: string; totalSeguidores: number }> {
    return (this.metricsAnimadas ?? this.metrics)?.topPerfisMaisSeguidos ?? []
  }

  alterarFiltroVistaRapida(filtro: 'all' | 'metricas' | 'rankings' | 'denuncias'): void {
    this.filtroVistaRapida = filtro
  }

  alterarFiltroDenuncias(filtro: string): void {
    this.filtroDenuncias = filtro === 'criticas' ? 'criticas' : 'all'
  }

  alterarBuscaDenuncias(valor: string): void {
    this.buscaDenuncias = valor.trim().toLowerCase()
  }

  alterarMotivoDenuncia(valor: string): void {
    this.filtroMotivoDenuncia = valor?.trim().toLowerCase() || 'all'
  }

  alterarTipoMediaPublicacao(valor: string): void {
    if (valor === 'texto' || valor === 'com-media' || valor === 'imagem' || valor === 'video') {
      this.filtroTipoMediaPublicacao = valor
      return
    }

    this.filtroTipoMediaPublicacao = 'all'
  }

  alterarOrdenacaoPublicacoes(valor: string): void {
    if (valor === 'reports-asc' || valor === 'recentes' || valor === 'antigas') {
      this.ordenacaoPublicacoes = valor
      return
    }

    this.ordenacaoPublicacoes = 'reports-desc'
  }

  alterarOrdenacaoComentarios(valor: string): void {
    if (valor === 'reports-asc' || valor === 'recentes' || valor === 'antigas') {
      this.ordenacaoComentarios = valor
      return
    }

    this.ordenacaoComentarios = 'reports-desc'
  }

  atualizarBuscaRanking(valor: string): void {
    this.buscaRanking = valor.trim().toLowerCase()
    this.paginaHashtags = 1
    this.paginaPerfis = 1
  }

  alterarOrdenacaoHashtags(valor: string): void {
    if (valor === 'usos-asc' || valor === 'nome-asc' || valor === 'nome-desc') {
      this.ordenacaoHashtags = valor
    } else {
      this.ordenacaoHashtags = 'usos-desc'
    }

    this.paginaHashtags = 1
  }

  alterarOrdenacaoPerfis(valor: string): void {
    if (valor === 'seguidores-asc' || valor === 'nome-asc' || valor === 'nome-desc') {
      this.ordenacaoPerfis = valor
    } else {
      this.ordenacaoPerfis = 'seguidores-desc'
    }

    this.paginaPerfis = 1
  }

  alterarTamanhoPagina(valor: number | string): void {
    const numero = typeof valor === 'number' ? valor : Number(valor)
    this.tamanhoPaginaTabela = Math.max(3, Math.min(10, Number.isFinite(numero) ? numero : 5))
    this.paginaHashtags = 1
    this.paginaPerfis = 1
  }

  alterarPeriodoRanking(valor: string): void {
    if (valor === '24h' || valor === '7d' || valor === '30d') {
      this.periodoRanking = valor
    } else {
      this.periodoRanking = '30d'
    }

    this.paginaHashtags = 1
    this.paginaPerfis = 1
    this.carregarMetrics(() => {
      this.ultimaAtualizacao = new Date()
    })
  }

  avancarPaginaHashtags(): void {
    this.paginaHashtags = Math.min(this.totalPaginasHashtags(), this.paginaHashtags + 1)
  }

  recuarPaginaHashtags(): void {
    this.paginaHashtags = Math.max(1, this.paginaHashtags - 1)
  }

  avancarPaginaPerfis(): void {
    this.paginaPerfis = Math.min(this.totalPaginasPerfis(), this.paginaPerfis + 1)
  }

  recuarPaginaPerfis(): void {
    this.paginaPerfis = Math.max(1, this.paginaPerfis - 1)
  }

  totalPaginasHashtags(): number {
    const totalItens = this.obterTopHashtagsOrdenadasFiltradas().length
    return Math.max(1, Math.ceil(totalItens / this.tamanhoPaginaTabela))
  }

  totalPaginasPerfis(): number {
    const totalItens = this.obterTopPerfisOrdenadosFiltrados().length
    return Math.max(1, Math.ceil(totalItens / this.tamanhoPaginaTabela))
  }

  obterTopHashtagsPaginadas(): Array<{ hashtag: string; usos: number }> {
    const itens = this.obterTopHashtagsOrdenadasFiltradas()
    const inicio = (this.paginaHashtags - 1) * this.tamanhoPaginaTabela
    return itens.slice(inicio, inicio + this.tamanhoPaginaTabela)
  }

  obterTopPerfisPaginados(): Array<{ userId: string; nome: string; nomeUtilizador: string; fotoPerfil?: string; totalSeguidores: number }> {
    const itens = this.obterTopPerfisOrdenadosFiltrados()
    const inicio = (this.paginaPerfis - 1) * this.tamanhoPaginaTabela
    return itens.slice(inicio, inicio + this.tamanhoPaginaTabela)
  }

  obterPublicacoesFiltradas(): PublicacaoDenunciada[] {
    let itens = [...this.publicacoes]

    if (this.filtroDenuncias === 'criticas') {
      itens = itens.filter(publicacao => publicacao.reportsCount >= 3)
    }

    if (this.filtroTipoMediaPublicacao === 'texto') {
      itens = itens.filter(publicacao => !publicacao.imagemUrl && !publicacao.videoUrl)
    } else if (this.filtroTipoMediaPublicacao === 'com-media') {
      itens = itens.filter(publicacao => !!publicacao.imagemUrl || !!publicacao.videoUrl)
    } else if (this.filtroTipoMediaPublicacao === 'imagem') {
      itens = itens.filter(publicacao => !!publicacao.imagemUrl)
    } else if (this.filtroTipoMediaPublicacao === 'video') {
      itens = itens.filter(publicacao => !!publicacao.videoUrl)
    }

    if (this.filtroMotivoDenuncia !== 'all') {
      itens = itens.filter(publicacao =>
        publicacao.reports.some(report => report.motivo.toLowerCase() === this.filtroMotivoDenuncia))
    }

    if (this.buscaDenuncias) {
      itens = itens.filter(publicacao => {
        const alvo = `${publicacao.texto} ${publicacao.donoNome} ${publicacao.donoNomeUtilizador}`.toLowerCase()
        const reporters = publicacao.reports
          .map(report => `${report.reporterNome} ${report.reporterNomeUtilizador} ${report.motivo} ${report.descricao ?? ''}`.toLowerCase())
          .join(' ')
        return alvo.includes(this.buscaDenuncias) || reporters.includes(this.buscaDenuncias)
      })
    }

    return this.ordenarItensDenunciados(itens, this.ordenacaoPublicacoes)
  }

  obterComentariosFiltrados(): ComentarioReportado[] {
    let itens = [...this.comentarios]

    if (this.filtroDenuncias === 'criticas') {
      itens = itens.filter(comentario => comentario.reportsCount >= 3)
    }

    if (this.filtroMotivoDenuncia !== 'all') {
      itens = itens.filter(comentario =>
        comentario.reports.some(report => report.motivo.toLowerCase() === this.filtroMotivoDenuncia))
    }

    if (this.buscaDenuncias) {
      itens = itens.filter(comentario => {
        const alvo = `${comentario.texto} ${comentario.autorNome} ${comentario.autorNomeUtilizador}`.toLowerCase()
        const reporters = comentario.reports
          .map(report => `${report.reporterNome} ${report.reporterNomeUtilizador} ${report.motivo} ${report.descricao ?? ''}`.toLowerCase())
          .join(' ')
        return alvo.includes(this.buscaDenuncias) || reporters.includes(this.buscaDenuncias)
      })
    }

    return this.ordenarItensDenunciados(itens, this.ordenacaoComentarios)
  }

  obterMotivosDenunciaDisponiveis(): string[] {
    const motivos = new Set<string>()

    this.publicacoes.forEach(publicacao => {
      publicacao.reports.forEach(report => {
        if (report.motivo?.trim()) {
          motivos.add(report.motivo.trim())
        }
      })
    })

    this.comentarios.forEach(comentario => {
      comentario.reports.forEach(report => {
        if (report.motivo?.trim()) {
          motivos.add(report.motivo.trim())
        }
      })
    })

    return [...motivos].sort((a, b) => a.localeCompare(b))
  }

  obterGradienteDonut(): string {
    const online = this.obterPercentagemOnline()
    const offline = this.obterPercentagemOffline()
    const ia = this.obterMediaIaPercentagem()
    const sobra = Math.max(0, 100 - (online + offline + ia))

    const faixaOnlineFim = online
    const faixaOfflineFim = online + offline
    const faixaIaFim = faixaOfflineFim + ia

    return `conic-gradient(
      #22c55e 0% ${faixaOnlineFim}%,
      #f59e0b ${faixaOnlineFim}% ${faixaOfflineFim}%,
      #7c3aed ${faixaOfflineFim}% ${faixaIaFim}%,
      color-mix(in srgb, var(--color-text-secondary) 18%, transparent) ${faixaIaFim}% ${Math.min(100, faixaIaFim + sobra)}%
    )`
  }

  obterBarrasAtividade(): number[] {
    const metrics = this.metricsAnimadas ?? this.metrics
    if (!metrics) {
      return [24, 36, 42, 48, 58, 62, 70]
    }

    const totalUsers = Math.max(1, metrics.totalUtilizadores)
    const totalMessages = Math.max(1, metrics.totalMensagensEnviadas)
    const base = this.obterPercentagemOnline()
    const mensagemPeso = Math.min(24, Math.round((metrics.totalMensagensRecebidas / totalMessages) * 20))
    const denunciaPeso = Math.min(18, Math.round((metrics.totalDenuncias / totalUsers) * 100))

    const serie = [
      base - 10,
      base - 4 + Math.round(mensagemPeso * 0.2),
      base + Math.round(mensagemPeso * 0.35),
      base + Math.round(mensagemPeso * 0.5),
      base + Math.round(mensagemPeso * 0.62) - Math.round(denunciaPeso * 0.22),
      base + Math.round(mensagemPeso * 0.78) - Math.round(denunciaPeso * 0.15),
      base + mensagemPeso - Math.round(denunciaPeso * 0.1)
    ]

    return serie.map(valor => Math.max(12, Math.min(96, valor)))
  }

  obterPontosLinha(): string {
    const serie = this.obterSerieTendencia()
    return serie
      .map((valor, indice) => `${16 + (indice * 62)},${116 - valor}`)
      .join(' ')
  }

  obterPontosArea(): string {
    const pontosLinha = this.obterPontosLinha()
    return `16,116 ${pontosLinha} 388,116`
  }

  resolverMedia(url?: string): string | undefined {
    return resolveMediaUrl(url)
  }

  private obterSerieTendencia(): number[] {
    const metrics = this.metricsAnimadas ?? this.metrics
    if (!metrics) {
      return [18, 24, 34, 46, 58, 70, 84]
    }

    const online = this.obterPercentagemOnline()
    const ia = this.obterMediaIaPercentagem()
    const denunciasPeso = Math.min(22, Math.round((metrics.totalDenuncias / Math.max(1, metrics.totalUtilizadores)) * 120))

    const serie = [
      Math.max(14, online - 18),
      Math.max(18, online - 10),
      Math.max(24, online - 4 + Math.round(ia * 0.18)),
      Math.max(32, online + Math.round(ia * 0.3) - Math.round(denunciasPeso * 0.28)),
      Math.max(44, online + Math.round(ia * 0.5) - Math.round(denunciasPeso * 0.18)),
      Math.max(56, online + Math.round(ia * 0.72) - Math.round(denunciasPeso * 0.12)),
      Math.max(66, online + Math.round(ia * 0.92) - Math.round(denunciasPeso * 0.08))
    ]

    return serie.map(valor => Math.min(100, valor))
  }

  private obterTopHashtagsOrdenadasFiltradas(): Array<{ hashtag: string; usos: number }> {
    const itens = this.obterTopHashtags().filter(item =>
      !this.buscaRanking || item.hashtag.toLowerCase().includes(this.buscaRanking))

    return itens.sort((a, b) => {
      if (this.ordenacaoHashtags === 'usos-asc') {
        return a.usos - b.usos
      }

      if (this.ordenacaoHashtags === 'nome-asc') {
        return a.hashtag.localeCompare(b.hashtag)
      }

      if (this.ordenacaoHashtags === 'nome-desc') {
        return b.hashtag.localeCompare(a.hashtag)
      }

      return b.usos - a.usos
    })
  }

  private obterTopPerfisOrdenadosFiltrados(): Array<{ userId: string; nome: string; nomeUtilizador: string; fotoPerfil?: string; totalSeguidores: number }> {
    const itens = this.obterTopPerfisSeguidos().filter(item => {
      if (!this.buscaRanking) {
        return true
      }

      const alvo = `${item.nome} ${item.nomeUtilizador}`.toLowerCase()
      return alvo.includes(this.buscaRanking)
    })

    return itens.sort((a, b) => {
      if (this.ordenacaoPerfis === 'seguidores-asc') {
        return a.totalSeguidores - b.totalSeguidores
      }

      if (this.ordenacaoPerfis === 'nome-asc') {
        return a.nome.localeCompare(b.nome)
      }

      if (this.ordenacaoPerfis === 'nome-desc') {
        return b.nome.localeCompare(a.nome)
      }

      return b.totalSeguidores - a.totalSeguidores
    })
  }

  private aplicarTransicaoMetricas(dados: AdminMetrics): void {
    if (!this.metricsAnimadas) {
      this.metricsAnimadas = { ...dados }
      return
    }

    if (this.metricsAnimationFrame !== null) {
      cancelAnimationFrame(this.metricsAnimationFrame)
      this.metricsAnimationFrame = null
    }

    this.cardsMorphState = !this.cardsMorphState
    const inicio = { ...this.metricsAnimadas }
    const fim = { ...dados }
    const inicioMs = performance.now()
    const duracaoBaseMs = 760
    const staggerMs = 58
    const campos = Object.keys(fim) as Array<keyof AdminMetrics>
    const indicePorCampo = new Map<keyof AdminMetrics, number>()
    this.ordemAnimacaoMetricas.forEach((campo, indice) => {
      indicePorCampo.set(campo, indice)
    })

    const ultimoIndice = Math.max(0, this.ordemAnimacaoMetricas.length - 1)
    const duracaoTotalMs = duracaoBaseMs + ultimoIndice * staggerMs + 420

    const animar = (agoraMs: number) => {
      const tempoDecorridoMs = agoraMs - inicioMs
      const progressoGlobal = Math.min(1, tempoDecorridoMs / duracaoTotalMs)
      const proximo = { ...fim } as AdminMetrics
      const proximoMutavel = proximo as unknown as Record<string, unknown>

      campos.forEach(campo => {
        const valorInicial = inicio[campo]
        const valorFinal = fim[campo]
        if (typeof valorInicial !== 'number' || typeof valorFinal !== 'number') {
          proximoMutavel[campo] = valorFinal
          return
        }

        const indiceCampo = indicePorCampo.get(campo) ?? 0
        const atrasoCampoMs = indiceCampo * staggerMs
        const categoriaCampo = this.categoriasVelocidade[String(campo)] ?? 'normal'
        const duracaoCampoMs = duracaoBaseMs * this.multiplicadorVelocidade[categoriaCampo]
        const progressoLocal = this.normalizarProgresso((tempoDecorridoMs - atrasoCampoMs) / duracaoCampoMs)
        const easingLocal = this.elasticSnapOut(progressoLocal)
        const valorInterpolado = valorInicial + (valorFinal - valorInicial) * easingLocal
        proximoMutavel[campo] = Number(valorInterpolado.toFixed(2))
      })

      this.metricsAnimadas = proximo

      if (progressoGlobal < 1) {
        this.metricsAnimationFrame = requestAnimationFrame(animar)
        return
      }

      this.metricsAnimadas = fim
      this.metricsAnimationFrame = null
    }

    this.metricsAnimationFrame = requestAnimationFrame(animar)
  }

  private ordenarItensDenunciados<T extends { reportsCount: number; criadoEm: string }>(
    itens: T[],
    ordenacao: 'reports-desc' | 'reports-asc' | 'recentes' | 'antigas'
  ): T[] {
    return itens.sort((a, b) => {
      if (ordenacao === 'reports-asc') {
        return a.reportsCount - b.reportsCount
      }

      if (ordenacao === 'recentes') {
        return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
      }

      if (ordenacao === 'antigas') {
        return new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime()
      }

      return b.reportsCount - a.reportsCount
    })
  }

  private normalizarProgresso(valor: number): number {
    if (valor <= 0) {
      return 0
    }

    if (valor >= 1) {
      return 1
    }

    return valor
  }

  private elasticSnapOut(t: number): number {
    if (t === 0 || t === 1) {
      return t
    }

    const c4 = (2 * Math.PI) / 3
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  }
}

import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Notificacao } from '../../../core/services/notification.service';
import { LegacyUser } from '../../../core/models/user.model';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, UserAvatarComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  utilizadorAtual: LegacyUser | null = null;
  termoPesquisa = '';
  menuAberto = false;
  totalNotificacoes = 0;
  notificacoesAberto = false;
  notificacoesPreview: Notificacao[] = [];
  private destroy$ = new Subject<void>();
  modoEscuro = false;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('nzolanet_theme');
    this.modoEscuro = savedTheme === 'dark';
    document.body.classList.toggle('light-theme', !this.modoEscuro);

    this.authService.utilizador$.pipe(takeUntil(this.destroy$)).subscribe((u: LegacyUser | null) => {
      this.utilizadorAtual = u;
      if (u) this.carregarNotificacoes();
    });
  }

  alternarTema(): void {
    this.modoEscuro = !this.modoEscuro;
    if (this.modoEscuro) {
      document.body.classList.remove('light-theme');
      localStorage.setItem('nzolanet_theme', 'dark');
    } else {
      document.body.classList.add('light-theme');
      localStorage.setItem('nzolanet_theme', 'light');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregarNotificacoes(): void {
    this.notificationService.obterNotificacoes().pipe(takeUntil(this.destroy$)).subscribe({
      next: (notificacoes) => {
        this.notificacoesPreview = notificacoes;
        this.totalNotificacoes = notificacoes.filter(n => !n.lida).length;
      },
      error: () => { this.totalNotificacoes = 0; }
    });
  }

  alternarNotificacoes(): void {
    this.notificacoesAberto = !this.notificacoesAberto;
    if (this.notificacoesAberto) {
      this.carregarNotificacoes();
    }
  }

  marcarTodasComoLidas(): void {
    this.notificationService.marcarComoLidas().subscribe({
      next: () => this.carregarNotificacoes(),
      error: () => {}
    });
  }

  pesquisar(): void {
    if (this.termoPesquisa.trim()) {
      this.router.navigate(['/pesquisar'], { queryParams: { q: this.termoPesquisa.trim() } });
    }
  }

  alternarMenuUtilizador(): void { this.menuAberto = !this.menuAberto; }
  fecharMenu(): void { this.menuAberto = false; }

  terminarSessao(): void {
    this.menuAberto = false;
    this.authService.terminarSessao();
  }

  get tituloPagina(): string {
    const url = this.router.url;
    if (url.startsWith('/pesquisar')) return 'Explore';
    if (url.startsWith('/notificacoes')) return 'Notificações';
    if (url.startsWith('/perfil')) return 'Perfil';
    if (url.startsWith('/publicacoes')) return 'Publicação';
    return 'Feed';
  }

  @HostListener('document:click', ['$event'])
  fecharMenuAoClicarFora(evento: MouseEvent): void {
    const alvo = evento.target as HTMLElement;
    if (!alvo.closest('.navbar__avatar-wrap')) this.menuAberto = false;
    if (!alvo.closest('.navbar__notificacoes') && !alvo.closest('.navbar__btn--notificacao')) this.notificacoesAberto = false;
  }
}

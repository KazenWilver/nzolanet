import { Component, OnInit, HostListener, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import type { AppNotification } from '../../../core/models/notification.model';
import type { LegacyUser } from '../../../core/models/user.model';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, UserAvatarComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  utilizadorAtual: LegacyUser | null = null;
  termoPesquisa = '';
  menuAberto = false;
  totalNotificacoes = 0;
  notificacoesAberto = false;
  notificacoesPreview: AppNotification[] = [];
  modoEscuro = false;

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('nzolanet_theme');
    this.modoEscuro = savedTheme === 'dark';
    document.body.classList.toggle('light-theme', !this.modoEscuro);

    this.authService.utilizador$.pipe(takeUntil(this.destroy$)).subscribe((user: LegacyUser | null) => {
      this.utilizadorAtual = user;
      if (user) {
        this.carregarNotificacoes();
      }
    });

    this.notificationService.unreadCount$.pipe(takeUntil(this.destroy$)).subscribe(count => {
      this.totalNotificacoes = count;
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
    this.notificationService.getNotifications().pipe(takeUntil(this.destroy$)).subscribe({
      next: notifications => {
        this.notificacoesPreview = notifications.slice(0, 5);
      },
      error: () => {
        this.notificacoesPreview = [];
      }
    });
  }

  alternarNotificacoes(): void {
    this.notificacoesAberto = !this.notificacoesAberto;
    if (this.notificacoesAberto) {
      this.carregarNotificacoes();
    }
  }

  marcarTodasComoLidas(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notificacoesPreview = this.notificacoesPreview.map(notification => ({
          ...notification,
          isRead: true
        }));
      },
      error: () => {}
    });
  }

  pesquisar(): void {
    if (this.termoPesquisa.trim()) {
      this.router.navigate(['/pesquisar'], { queryParams: { q: this.termoPesquisa.trim() } });
    }
  }

  alternarMenuUtilizador(): void {
    this.menuAberto = !this.menuAberto;
  }

  fecharMenu(): void {
    this.menuAberto = false;
  }

  terminarSessao(): void {
    this.menuAberto = false;
    this.authService.terminarSessao();
  }

  get tituloPagina(): string {
    const url = this.router.url;
    if (url.startsWith('/pesquisar') || url.startsWith('/search')) return 'Explore';
    if (url.startsWith('/notificacoes') || url.startsWith('/notifications')) return 'Notificações';
    if (url.startsWith('/perfil') || url.startsWith('/profile')) return 'Perfil';
    return 'Feed';
  }

  @HostListener('document:click', ['$event'])
  fecharMenuAoClicarFora(evento: MouseEvent): void {
    const alvo = evento.target as HTMLElement;
    if (!alvo.closest('.navbar__avatar-wrap')) this.menuAberto = false;
    if (!alvo.closest('.navbar__notificacoes') && !alvo.closest('.navbar__btn--notificacao')) {
      this.notificacoesAberto = false;
    }
  }
}

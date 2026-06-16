import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Notificacao } from '../../../core/services/notification.service';
import { User } from '../../../core/models/user.model';
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
  utilizadorAtual: User | null = null;
  termoPesquisa = '';
  menuAberto = false;
  totalNotificacoes = 0;
  notificacoesAberto = false;
  notificacoesPreview: Notificacao[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.utilizador$.pipe(takeUntil(this.destroy$)).subscribe((u: User | null) => {
      this.utilizadorAtual = u;
      if (u) this.carregarNotificacoes();
    });
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

  @HostListener('document:click', ['$event'])
  fecharMenuAoClicarFora(evento: MouseEvent): void {
    const alvo = evento.target as HTMLElement;
    if (!alvo.closest('.navbar__avatar-wrap')) this.menuAberto = false;
    if (!alvo.closest('.navbar__notificacoes') && !alvo.closest('.navbar__btn--notificacao')) this.notificacoesAberto = false;
  }
}
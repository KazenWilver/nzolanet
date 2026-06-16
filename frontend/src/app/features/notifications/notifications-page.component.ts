import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notificacao } from '../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.scss'
})
export class NotificationsPageComponent implements OnInit {
  notificacoes: Notificacao[] = [];
  aCarregar = true;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.carregarNotificacoes();
  }

  carregarNotificacoes(): void {
    this.aCarregar = true;
    this.notificationService.obterNotificacoes().subscribe({
      next: notificacoes => {
        this.notificacoes = notificacoes;
        this.aCarregar = false;
      },
      error: () => { this.notificacoes = []; this.aCarregar = false; }
    });
  }

  marcarComoLidas(): void {
    this.notificationService.marcarComoLidas().subscribe({
      next: () => this.carregarNotificacoes(),
      error: () => {}
    });
  }

  remover(id: number): void {
    this.notificationService.remover(id).subscribe({
      next: () => { this.notificacoes = this.notificacoes.filter(n => n.id !== id); },
      error: () => {}
    });
  }
}

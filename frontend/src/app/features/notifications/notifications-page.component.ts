import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import type { AppNotification } from '../../core/models/notification.model';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, AvatarComponent, LoadingSpinnerComponent, TimeAgoPipe],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.scss'
})
export class NotificationsPageComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  notifications: AppNotification[] = [];
  loading = true;
  error = false;
  markingAll = false;

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.error = false;

    this.notificationService.getNotifications().subscribe({
      next: notifications => {
        this.notifications = notifications;
        this.loading = false;
        this.notificationService.refreshUnreadCount().subscribe();
      },
      error: () => {
        this.loading = false;
        this.error = true;
      }
    });
  }

  handleMarkAllAsRead(): void {
    if (this.markingAll) {
      return;
    }

    this.markingAll = true;

    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map(notification => ({
          ...notification,
          isRead: true
        }));
        this.markingAll = false;
      },
      error: () => {
        this.markingAll = false;
      }
    });
  }

  handleNotificationClick(notification: AppNotification): void {
    const wasUnread = !notification.isRead;

    if (wasUnread) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          this.notifications = this.notifications.map(item =>
            item.id === notification.id ? { ...item, isRead: true } : item
          );
        },
        error: () => {
          // Mantém navegação mesmo se marcar como lida falhar
        }
      });
    }

    this.navigateForNotification(notification);
  }

  handleDelete(notification: AppNotification, event: MouseEvent): void {
    event.stopPropagation();

    const wasUnread = !notification.isRead;

    this.notificationService.deleteNotification(notification.id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(item => item.id !== notification.id);
        this.notificationService.notifyUnreadDecreased(wasUnread);
      },
      error: () => {
        // Falha silenciosa — utilizador pode tentar novamente
      }
    });
  }

  handleNotificationKeydown(notification: AppNotification, event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleNotificationClick(notification);
    }
  }

  getMessage(notification: AppNotification): string {
    switch (notification.type) {
      case 'baze':
        return 'deu baze na tua publicação';
      case 'comment':
        return 'comentou na tua publicação';
      case 'follow':
        return 'começou a seguir-te';
      default:
        return '';
    }
  }

  getContextText(notification: AppNotification): string | undefined {
    if (notification.type === 'comment') {
      return notification.commentText ?? notification.publicationText;
    }

    return notification.publicationText;
  }

  trackById(_: number, notification: AppNotification): string {
    return notification.id;
  }

  private navigateForNotification(notification: AppNotification): void {
    if (notification.type === 'follow') {
      void this.router.navigate(['/profile', notification.actorId]);
      return;
    }

    if (notification.publicationId) {
      void this.router.navigate(['/feed'], {
        queryParams: {
          publicacao: notification.publicationId,
          comentarios: notification.type === 'comment' ? '1' : null
        }
      });
      return;
    }

    void this.router.navigate(['/feed']);
  }
}

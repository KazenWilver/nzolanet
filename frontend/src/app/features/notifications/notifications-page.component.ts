import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { UserService } from '../../core/services/user.service';
import type { AppNotification } from '../../core/models/notification.model';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EnterAnimationDirective } from '../../shared/directives/enter-animation.directive';
import { PressScaleDirective } from '../../shared/directives/press-scale.directive';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { RelativeTimeService } from '../../core/services/relative-time.service';
import { TPipe } from '../../core/i18n/translate.pipe';
import { LocaleService } from '../../core/i18n/locale.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, AvatarComponent, LoadingSpinnerComponent, PageHeaderComponent, TimeAgoPipe, EnterAnimationDirective, PressScaleDirective, TPipe],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.scss'
})
export class NotificationsPageComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly localeService = inject(LocaleService);
  readonly relativeTime = inject(RelativeTimeService);

  notifications: AppNotification[] = [];
  loading = true;
  error = false;
  markingAll = false;
  processingRequestId: string | null = null;

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.error = false;

    this.notificationService
      .getNotifications()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: notifications => {
        this.notifications = notifications;
        this.loading = false;
        this.notificationService
          .refreshUnreadCount()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe();
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

    this.notificationService
      .markAllAsRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
    if (notification.type === 'follow_request') {
      this.navigateForNotification(notification);
      this.markNotificationRead(notification);
      return;
    }

    this.navigateForNotification(notification);
    this.markNotificationRead(notification);
  }

  handleApproveRequest(notification: AppNotification, event: MouseEvent): void {
    event.stopPropagation();
    this.processFollowRequest(notification, 'approve');
  }

  handleRejectRequest(notification: AppNotification, event: MouseEvent): void {
    event.stopPropagation();
    this.processFollowRequest(notification, 'reject');
  }

  handleDelete(notification: AppNotification, event: MouseEvent): void {
    event.stopPropagation();

    const wasUnread = !notification.isRead;

    this.notificationService
      .deleteNotification(notification.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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

  isFollowRequest(notification: AppNotification): boolean {
    return notification.type === 'follow_request';
  }

  isProcessing(notification: AppNotification): boolean {
    return this.processingRequestId === notification.id;
  }

  getMessage(notification: AppNotification): string {
    switch (notification.type) {
      case 'baze':
        return this.localeService.translate('notifications.liked');
      case 'comment':
        return this.localeService.translate('notifications.commented');
      case 'follow':
        return this.localeService.translate('notifications.followed');
      case 'follow_request':
        return 'pediu para te seguir';
      case 'follow_accepted':
        return 'aceitou o teu pedido de seguimento';
      case 'follow_rejected':
        return 'recusou o teu pedido de seguimento';
      case 'message':
        return this.localeService.translate('notifications.sentMessage');
      default:
        return '';
    }
  }

  getContextText(notification: AppNotification): string | undefined {
    if (notification.type === 'comment') {
      return notification.commentText ?? notification.publicationText;
    }

    if (notification.type === 'message') {
      return notification.messageText;
    }

    return notification.publicationText;
  }

  trackById(_: number, notification: AppNotification): string {
    return notification.id;
  }

  private processFollowRequest(
    notification: AppNotification,
    action: 'approve' | 'reject'
  ): void {
    if (this.processingRequestId) {
      return;
    }

    this.processingRequestId = notification.id;

    const request$ =
      action === 'approve'
        ? this.userService.approveFollowRequest(notification.actorId)
        : this.userService.rejectFollowRequest(notification.actorId);

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: () => {
        const wasUnread = !notification.isRead;
        this.notifications = this.notifications.filter(item => item.id !== notification.id);
        this.notificationService.notifyUnreadDecreased(wasUnread);
        this.processingRequestId = null;
      },
      error: () => {
        this.processingRequestId = null;
      }
    });
  }

  private markNotificationRead(notification: AppNotification): void {
    if (notification.isRead) {
      return;
    }

    this.notifications = this.notifications.map(item =>
      item.id === notification.id ? { ...item, isRead: true } : item
    );

    this.notificationService.markAsReadLocally(notification.id);
  }

  private navigateForNotification(notification: AppNotification): void {
    if (
      notification.type === 'follow' ||
      notification.type === 'follow_request' ||
      notification.type === 'follow_accepted' ||
      notification.type === 'follow_rejected'
    ) {
      void this.router.navigate(['/profile', notification.actorId], {
        queryParams: notification.type === 'follow_request' ? { pedido: '1' } : null
      });
      return;
    }

    if (notification.publicationId) {
      void this.router.navigate(['/publicacoes', notification.publicationId]);
      return;
    }

    if (notification.type === 'message' && notification.conversationId) {
      void this.router.navigate(['/messages', notification.conversationId]);
      return;
    }

    void this.router.navigate(['/feed']);
  }
}

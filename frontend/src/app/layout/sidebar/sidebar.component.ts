import { Component, DestroyRef, HostListener, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import type { User } from '../../core/models/user.model';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ThemeService } from '../../core/services/theme.service';
import { PublishModalService } from '../../core/services/publish-modal.service';
import { ConversationService } from '../../core/services/conversation.service';
import { NotificationService } from '../../core/services/notification.service';
import { PressScaleDirective } from '../../shared/directives/press-scale.directive';
import { TPipe } from '../../core/i18n/translate.pipe';

interface SidebarLinkItem {
  type: 'link';
  id: string;
  label: string;
  labelKey?: string;
  route: string;
  exact?: boolean;
  icon: string;
}

interface SidebarPlaceholderItem {
  type: 'placeholder';
  id: string;
  label: string;
  labelKey?: string;
  route: string;
  icon: string;
}

interface SidebarNotificationsItem {
  type: 'notifications';
  id: string;
  label: string;
  labelKey?: string;
  route: string;
  icon: string;
}

interface SidebarMessagesItem {
  type: 'messages';
  id: string;
  label: string;
  labelKey?: string;
  route: string;
  icon: string;
}

type SidebarItem = SidebarLinkItem | SidebarPlaceholderItem | SidebarNotificationsItem | SidebarMessagesItem;

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, AvatarComponent, PressScaleDirective, TPipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  private readonly publishModal = inject(PublishModalService);
  private readonly notificationService = inject(NotificationService);
  private readonly conversationService = inject(ConversationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  currentUser: User | null = null;
  unreadCount = 0;
  unreadMessagesCount = 0;
  accountMenuOpen = false;

  readonly primaryNavItems: SidebarItem[] = [
    { type: 'link', id: 'feed', label: 'Feed', labelKey: 'nav.feed', route: '/feed', exact: true, icon: 'home' },
    { type: 'link', id: 'search', label: 'Pesquisar', labelKey: 'nav.search', route: '/search', icon: 'search' },
    { type: 'notifications', id: 'notifications', label: 'Notificações', labelKey: 'nav.notifications', route: '/notifications', icon: 'bell' },
    { type: 'messages', id: 'messages', label: 'Mensagens', labelKey: 'nav.messages', route: '/messages', icon: 'mail' },
    { type: 'link', id: 'bookmarks', label: 'Guardados', labelKey: 'nav.bookmarks', route: '/bookmarks', icon: 'bookmark' }
  ];

  readonly secondaryNavItems: SidebarItem[] = [
    { type: 'link', id: 'settings', label: 'Definições', labelKey: 'nav.settings', route: '/settings', icon: 'settings' }
  ];

  constructor() {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser = user;
      });

    this.notificationService.unreadCount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(count => {
        this.unreadCount = count;
      });

    this.conversationService.unreadCount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(count => {
        this.unreadMessagesCount = count;
      });
  }

  isMessagesItem(item: SidebarItem): item is SidebarMessagesItem {
    return item.type === 'messages';
  }

  get profileRoute(): string {
    return this.currentUser ? `/profile/${this.currentUser.id}` : '/profile/me';
  }

  get displayName(): string {
    return this.currentUser?.displayName ?? this.currentUser?.username ?? 'Utilizador';
  }

  isNotificationsItem(item: SidebarItem): item is SidebarNotificationsItem {
    return item.type === 'notifications';
  }

  handleOpenPublishModal(): void {
    this.publishModal.open();
  }

  handleToggleTheme(): void {
    this.themeService.toggleTheme();
  }

  handleToggleAccountMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.accountMenuOpen = !this.accountMenuOpen;
  }

  handleLogout(): void {
    this.accountMenuOpen = false;
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  @HostListener('document:click')
  handleDocumentClick(): void {
    this.accountMenuOpen = false;
  }

  isActive(route: string, exact = false): boolean {
    if (exact) {
      return this.router.url === route || this.router.url.startsWith(`${route}?`);
    }

    return this.router.url.startsWith(route);
  }
}

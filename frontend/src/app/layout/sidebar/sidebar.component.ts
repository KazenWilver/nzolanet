import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import type { User } from '../../core/models/user.model';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ThemeService } from '../../core/services/theme.service';
import { PublishModalService } from '../../core/services/publish-modal.service';

interface SidebarLinkItem {
  type: 'link';
  id: string;
  label: string;
  route: string;
  exact?: boolean;
  icon: string;
}

interface SidebarPlaceholderItem {
  type: 'placeholder';
  id: string;
  label: string;
  route: string;
  icon: string;
}

type SidebarItem = SidebarLinkItem | SidebarPlaceholderItem;

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, AvatarComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  private readonly publishModal = inject(PublishModalService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  currentUser: User | null = null;

  readonly primaryNavItems: SidebarItem[] = [
    { type: 'link', id: 'feed', label: 'Feed', route: '/feed', exact: true, icon: 'home' },
    { type: 'link', id: 'search', label: 'Pesquisar', route: '/search', icon: 'search' },
    { type: 'placeholder', id: 'notifications', label: 'Notificações', route: '/notifications', icon: 'bell' },
    { type: 'placeholder', id: 'messages', label: 'Mensagens', route: '/messages', icon: 'mail' }
  ];

  readonly secondaryNavItems: SidebarItem[] = [
    { type: 'link', id: 'settings', label: 'Definições', route: '/settings', icon: 'settings' }
  ];

  constructor() {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  get profileRoute(): string {
    return this.currentUser ? `/profile/${this.currentUser.id}` : '/profile/me';
  }

  get displayName(): string {
    return this.currentUser?.displayName ?? this.currentUser?.username ?? 'Utilizador';
  }

  handleOpenPublishModal(): void {
    this.publishModal.open();
  }

  handleToggleTheme(): void {
    this.themeService.toggleTheme();
  }

  isActive(route: string, exact = false): boolean {
    if (exact) {
      return this.router.url === route || this.router.url.startsWith(`${route}?`);
    }

    return this.router.url.startsWith(route);
  }
}

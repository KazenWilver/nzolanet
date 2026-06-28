import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import type { User } from '../../core/models/user.model';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { CreatePostComponent } from '../../features/feed/create-post/create-post.component';
import { ThemeService } from '../../core/services/theme.service';

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
  imports: [CommonModule, RouterModule, AvatarComponent, ModalComponent, CreatePostComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  currentUser: User | null = null;
  publishModalOpen = false;

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
    this.publishModalOpen = true;
  }

  handleClosePublishModal(): void {
    this.publishModalOpen = false;
  }

  handlePostCreated(): void {
    this.publishModalOpen = false;
    if (!this.router.url.startsWith('/feed')) {
      void this.router.navigate(['/feed']);
    }
  }

  handleToggleTheme(): void {
    this.themeService.toggleTheme();
  }

  handleLogout(): void {
    this.authService.logout();
  }

  isActive(route: string, exact = false): boolean {
    if (exact) {
      return this.router.url === route || this.router.url.startsWith(`${route}?`);
    }

    return this.router.url.startsWith(route);
  }
}

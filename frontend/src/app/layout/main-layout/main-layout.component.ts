import { Component, DestroyRef, HostListener, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { AsideComponent } from '../aside/aside.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { CreatePostComponent } from '../../features/feed/create-post/create-post.component';
import { PublishModalService } from '../../core/services/publish-modal.service';
import { AccountMenuService } from '../../core/services/account-menu.service';
import { AuthService } from '../../core/services/auth.service';
import { RouteTransitionService } from '../../core/services/route-transition.service';
import type { User } from '../../core/models/user.model';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterModule, SidebarComponent, TopbarComponent, AsideComponent, ModalComponent, CreatePostComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly routeTransition = inject(RouteTransitionService);
  readonly publishModal = inject(PublishModalService);
  readonly accountMenu = inject(AccountMenuService);

  currentUser: User | null = null;
  showMobileTopbar = false;
  private initialNavigation = true;
  private previousPath = '';

  constructor() {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser = user;
        if (!user) {
          this.accountMenu.close();
        }
      });

    this.previousPath = this.router.url.split('?')[0];
    this.updateMobileTopbar(this.router.url);

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationStart | NavigationEnd | NavigationCancel | NavigationError =>
            event instanceof NavigationStart ||
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(event => {
        if (event instanceof NavigationCancel || event instanceof NavigationError) {
          this.routeTransition.resetRouteHost();
          return;
        }

        if (event instanceof NavigationStart) {
          const nextPath = event.url.split('?')[0];
          if (nextPath !== this.previousPath) {
            this.routeTransition.animateOut();
          }
          return;
        }

        const currentPath = event.urlAfterRedirects.split('?')[0];
        this.updateMobileTopbar(event.urlAfterRedirects);

        if (this.initialNavigation) {
          this.initialNavigation = false;
          this.routeTransition.skipEnterOnce();
          this.previousPath = currentPath;
          return;
        }

        if (currentPath !== this.previousPath) {
          this.routeTransition.animateIn();
        }

        this.previousPath = currentPath;
      });
  }

  get profileRoute(): string {
    return this.currentUser ? `/profile/${this.currentUser.id}` : '/profile/me';
  }

  handleClosePublishModal(): void {
    this.publishModal.close();
  }

  handlePostCreated(): void {
    this.publishModal.close();
    if (!this.router.url.startsWith('/feed')) {
      void this.router.navigate(['/feed']);
    }
  }

  handleCloseAccountMenu(): void {
    this.accountMenu.close();
  }

  handleAccountMenuNavigate(): void {
    this.accountMenu.close();
  }

  private updateMobileTopbar(url: string): void {
    const path = url.split('?')[0];
    this.showMobileTopbar = path === '/feed';
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.accountMenu.isOpen()) {
      this.accountMenu.close();
    }
  }
}

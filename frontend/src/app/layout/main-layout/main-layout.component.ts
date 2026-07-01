import { Component, DestroyRef, ElementRef, HostListener, ViewChild, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { AsideComponent } from '../aside/aside.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { CreatePostComponent } from '../../features/feed/create-post/create-post.component';
import { PublicationThreadModalComponent } from '../../shared/components/publication-thread-modal/publication-thread-modal.component';
import { PublishModalService } from '../../core/services/publish-modal.service';
import { AccountMenuService } from '../../core/services/account-menu.service';
import { AuthService } from '../../core/services/auth.service';
import { RouteTransitionService } from '../../core/services/route-transition.service';
import { FocusTrapService } from '../../core/services/focus-trap.service';
import { PublicationMediaOverlayService } from '../../core/services/publication-media-overlay.service';
import type { User } from '../../core/models/user.model';
import type { Publication } from '../../core/models/publication.model';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterModule,
    SidebarComponent,
    TopbarComponent,
    AsideComponent,
    ModalComponent,
    CreatePostComponent,
    PublicationThreadModalComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly routeTransition = inject(RouteTransitionService);
  private readonly focusTrap = inject(FocusTrapService);
  readonly publishModal = inject(PublishModalService);
  readonly accountMenu = inject(AccountMenuService);
  readonly mediaOverlay = inject(PublicationMediaOverlayService);

  @ViewChild('accountMenuNav') accountMenuNavRef?: ElementRef<HTMLElement>;

  currentUser: User | null = null;
  showMobileTopbar = false;
  isMessagesRoute = false;
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
    this.isMessagesRoute = this.previousPath.startsWith('/messages');
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
        this.isMessagesRoute = currentPath.startsWith('/messages');
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

    effect(() => {
      if (this.accountMenu.isOpen()) {
        requestAnimationFrame(() => this.handleAccountMenuOpened());
      }
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

  handleCloseMediaOverlay(): void {
    this.mediaOverlay.close();
  }

  handleMediaOverlayPublicationChange(publication: Publication): void {
    this.mediaOverlay.updatePublication(publication);
  }

  handleCloseAccountMenu(): void {
    this.focusTrap.deactivate();
    this.accountMenu.close();
  }

  handleAccountMenuNavigate(): void {
    this.focusTrap.deactivate();
    this.accountMenu.close();
  }

  handleAccountMenuOpened(): void {
    requestAnimationFrame(() => {
      const menu = this.accountMenuNavRef?.nativeElement;
      if (!menu) {
        return;
      }

      const firstItem = menu.querySelector<HTMLElement>('[role="menuitem"]');
      this.focusTrap.activate(menu, firstItem ?? undefined);
    });
  }

  @HostListener('document:keydown', ['$event'])
  handleAccountMenuKeydown(event: KeyboardEvent): void {
    if (!this.accountMenu.isOpen()) {
      return;
    }

    const menu = this.accountMenuNavRef?.nativeElement;
    if (!menu) {
      return;
    }

    const items = Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]')).filter(
      item => item.offsetParent !== null
    );

    if (items.length === 0) {
      return;
    }

    const activeIndex = items.findIndex(item => item === document.activeElement);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = activeIndex < 0 ? 0 : (activeIndex + 1) % items.length;
      items[nextIndex].focus();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const nextIndex = activeIndex <= 0 ? items.length - 1 : activeIndex - 1;
      items[nextIndex].focus();
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      items[0].focus();
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      items[items.length - 1].focus();
    }
  }

  private updateMobileTopbar(url: string): void {
    const path = url.split('?')[0];
    this.showMobileTopbar = path === '/feed';
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.mediaOverlay.state()) {
      this.handleCloseMediaOverlay();
      return;
    }

    if (this.accountMenu.isOpen()) {
      this.handleCloseAccountMenu();
    }
  }
}

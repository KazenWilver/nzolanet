import { Component, DestroyRef, ElementRef, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { AccountMenuService } from '../../core/services/account-menu.service';
import { AnimationService } from '../../core/services/animation.service';
import type { FeedTab } from '../../core/services/feed-tab.service';
import type { User } from '../../core/models/user.model';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { PressScaleDirective } from '../../shared/directives/press-scale.directive';
import { TPipe } from '../../core/i18n/translate.pipe';

type MobileTopbarMode = 'hidden' | 'feed' | 'title';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterModule, AvatarComponent, PressScaleDirective, TPipe],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  private readonly authService = inject(AuthService);
  private readonly accountMenu = inject(AccountMenuService);
  private readonly animationService = inject(AnimationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('feedTabs') feedTabsRef?: ElementRef<HTMLElement>;

  currentUser: User | null = null;
  visibleOnMobile = false;
  topbarMode: MobileTopbarMode = 'hidden';
  pageTitleKey = '';
  activeFeedTab: FeedTab = 'para-ti';

  constructor() {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser = user;
        if (!user) {
          this.accountMenu.close();
        }
      });

    this.syncFromUrl(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(event => {
        this.syncFromUrl(event.urlAfterRedirects);
      });
  }

  get accountMenuOpen(): boolean {
    return this.accountMenu.isOpen();
  }

  handleToggleAccountMenu(trigger: HTMLElement): void {
    this.accountMenu.toggle(trigger);
  }

  setFeedTab(tab: FeedTab): void {
    if (tab === this.activeFeedTab) {
      return;
    }

    void this.router.navigate(['/feed'], {
      queryParams: { tab: tab === 'a-seguir' ? 'a-seguir' : null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  private syncFromUrl(url: string): void {
    const path = url.split('?')[0];

    if (path === '/feed') {
      this.visibleOnMobile = true;
      this.topbarMode = 'feed';
      this.pageTitleKey = '';
      this.syncFeedTab(url);
      return;
    }

    const titleRoutes: ReadonlyArray<{ prefix: string; titleKey: string }> = [
      { prefix: '/search', titleKey: 'nav.search' },
      { prefix: '/notifications', titleKey: 'notifications.title' },
      { prefix: '/bookmarks', titleKey: 'nav.bookmarks' },
      { prefix: '/settings', titleKey: 'nav.settings' },
      { prefix: '/profile', titleKey: 'nav.profile' }
    ];

    const matchedRoute = titleRoutes.find(route => path === route.prefix || path.startsWith(`${route.prefix}/`));
    if (matchedRoute) {
      this.visibleOnMobile = true;
      this.topbarMode = 'title';
      this.pageTitleKey = matchedRoute.titleKey;
      return;
    }

    this.visibleOnMobile = false;
    this.topbarMode = 'hidden';
    this.pageTitleKey = '';
  }

  private syncFeedTab(url: string): void {
    const query = url.includes('?') ? url.split('?')[1] : '';
    const params = new URLSearchParams(query);
    const nextTab: FeedTab = params.get('tab') === 'a-seguir' ? 'a-seguir' : 'para-ti';

    if (nextTab !== this.activeFeedTab) {
      this.activeFeedTab = nextTab;
      requestAnimationFrame(() => this.animateTabIndicator());
    }
  }

  private animateTabIndicator(): void {
    const tabs = this.feedTabsRef?.nativeElement;
    if (!tabs) {
      return;
    }

    const active = tabs.querySelector<HTMLElement>('.topbar__feed-tab--active');
    if (active) {
      this.animationService.tabIndicator(active);
    }
  }
}

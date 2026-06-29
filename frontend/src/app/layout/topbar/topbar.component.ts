import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { AccountMenuService } from '../../core/services/account-menu.service';
import { ThemeService } from '../../core/services/theme.service';
import type { User } from '../../core/models/user.model';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterModule, AvatarComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  readonly themeService = inject(ThemeService);
  private readonly authService = inject(AuthService);
  private readonly accountMenu = inject(AccountMenuService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  currentUser: User | null = null;
  visibleOnMobile = false;

  constructor() {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser = user;
        if (!user) {
          this.accountMenu.close();
        }
      });

    this.updateVisibility(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(event => {
        this.updateVisibility(event.urlAfterRedirects);
      });
  }

  get accountMenuOpen(): boolean {
    return this.accountMenu.isOpen();
  }

  handleToggleTheme(): void {
    this.themeService.toggleTheme();
  }

  handleToggleAccountMenu(): void {
    this.accountMenu.toggle();
  }

  private updateVisibility(url: string): void {
    const path = url.split('?')[0];
    this.visibleOnMobile = path === '/feed';
  }
}

import { Component, DestroyRef, HostListener, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
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
  private readonly destroyRef = inject(DestroyRef);

  currentUser: User | null = null;
  accountMenuOpen = false;

  constructor() {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser = user;
        if (!user) {
          this.accountMenuOpen = false;
        }
      });
  }

  get profileRoute(): string {
    return this.currentUser ? `/profile/${this.currentUser.id}` : '/profile/me';
  }

  handleToggleTheme(): void {
    this.themeService.toggleTheme();
  }

  handleToggleAccountMenu(): void {
    this.accountMenuOpen = !this.accountMenuOpen;
  }

  handleCloseAccountMenu(): void {
    this.accountMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.topbar__account')) {
      this.accountMenuOpen = false;
    }
  }
}

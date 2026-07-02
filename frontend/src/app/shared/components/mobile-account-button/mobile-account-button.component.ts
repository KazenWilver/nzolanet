import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { AccountMenuService } from '../../../core/services/account-menu.service';
import type { User } from '../../../core/models/user.model';
import { AvatarComponent } from '../avatar/avatar.component';

/**
 * Botão de avatar para abrir o menu da conta em páginas sem topbar mobile.
 */
@Component({
  selector: 'app-mobile-account-button',
  standalone: true,
  imports: [AvatarComponent],
  template: `
    @if (currentUser) {
      <button
        #trigger
        type="button"
        class="mobile-account-button"
        (click)="handleToggleMenu(trigger)"
        [attr.aria-expanded]="accountMenu.isOpen()"
        aria-haspopup="dialog"
        [attr.aria-label]="'Menu de ' + currentUser.username"
      >
        <app-avatar
          [src]="currentUser.profilePhotoUrl"
          [username]="currentUser.username"
          size="sm"
        />
      </button>
    }
  `,
  styles: `
    .mobile-account-button {
      display: none;
      align-items: center;
      justify-content: center;
      padding: 0;
      border: none;
      background: transparent;
      border-radius: var(--border-radius-full);
      cursor: pointer;
      flex-shrink: 0;
    }

    .mobile-account-button:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }

    @media (max-width: 500px) {
      .mobile-account-button {
        display: inline-flex;
      }
    }
  `
})
export class MobileAccountButtonComponent {
  private readonly authService = inject(AuthService);
  readonly accountMenu = inject(AccountMenuService);
  private readonly destroyRef = inject(DestroyRef);

  currentUser: User | null = null;

  constructor() {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  handleToggleMenu(trigger: HTMLElement): void {
    this.accountMenu.toggle(trigger);
  }
}

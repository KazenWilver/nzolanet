import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import type { User } from '../../core/models/user.model';
import { PlaceholderFeatureComponent } from '../../shared/components/placeholder-feature/placeholder-feature.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

type SettingsSection = 'account' | 'privacy' | 'password';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, PlaceholderFeatureComponent, LoadingSpinnerComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  readonly maxBioLength = 160;
  readonly sections: Array<{ id: SettingsSection; label: string }> = [
    { id: 'account', label: 'Conta' },
    { id: 'privacy', label: 'Privacidade' },
    { id: 'password', label: 'Palavra-passe' }
  ];

  activeSection: SettingsSection = 'account';
  user: User | null = null;

  displayName = '';
  bio = '';
  savingAccount = false;
  accountError = '';
  accountSuccess = false;

  privacyLoading = false;
  privacyError = '';

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.user = user;
        if (user) {
          this.displayName = user.displayName ?? user.username;
          this.bio = user.bio ?? '';
        }
      });
  }

  get remainingBioChars(): number {
    return this.maxBioLength - this.bio.length;
  }

  setSection(section: SettingsSection): void {
    this.activeSection = section;
    this.accountSuccess = false;
    this.accountError = '';
    this.privacyError = '';
  }

  saveAccount(): void {
    if (!this.user || this.savingAccount) {
      return;
    }

    this.savingAccount = true;
    this.accountError = '';
    this.accountSuccess = false;

    this.userService
      .updateProfile(this.user.id, {
        displayName: this.displayName.trim() || this.user.username,
        bio: this.bio.trim()
      })
      .subscribe({
        next: updatedUser => {
          this.authService.updateCurrentUser(updatedUser);
          this.user = updatedUser;
          this.savingAccount = false;
          this.accountSuccess = true;
        },
        error: () => {
          this.savingAccount = false;
          this.accountError = 'Não foi possível guardar as alterações.';
        }
      });
  }

  togglePrivacy(): void {
    if (!this.user || this.privacyLoading) {
      return;
    }

    const previousValue = this.user.isPrivate;
    const nextValue = !previousValue;

    this.user = { ...this.user, isPrivate: nextValue };
    this.privacyLoading = true;
    this.privacyError = '';

    this.userService.updateProfile(this.user.id, { isPrivate: nextValue }).subscribe({
      next: updatedUser => {
        this.authService.updateCurrentUser(updatedUser);
        this.user = updatedUser;
        this.privacyLoading = false;
      },
      error: () => {
        if (this.user) {
          this.user = { ...this.user, isPrivate: previousValue };
        }
        this.privacyLoading = false;
        this.privacyError = 'Não foi possível actualizar a privacidade.';
      }
    });
  }

  handleLogout(): void {
    this.authService.logout();
  }
}

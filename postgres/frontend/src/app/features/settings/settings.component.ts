import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { translateApiMessage } from '../../core/helpers/translate-api-message.helper';
import type { User } from '../../core/models/user.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { TPipe } from '../../core/i18n/translate.pipe';

type SettingsSection = 'account' | 'privacy' | 'password' | 'about';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent, TPipe],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);

  readonly maxBioLength = 160;
  readonly sections: Array<{ id: SettingsSection; label: string }> = [
    { id: 'account', label: 'Conta' },
    { id: 'privacy', label: 'Privacidade' },
    { id: 'password', label: 'Palavra-passe' },
    { id: 'about', label: 'Sobre nós' }
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

  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  savingPassword = false;
  passwordError = '';
  passwordSuccess = false;

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const section = params.get('section');
        if (section === 'about' || section === 'account' || section === 'privacy' || section === 'password') {
          this.activeSection = section;
        }
      });

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
    this.passwordError = '';
    this.passwordSuccess = false;
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
      .pipe(takeUntilDestroyed(this.destroyRef))
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

    this.userService
      .updateProfile(this.user.id, { isPrivate: nextValue })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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

  changePassword(): void {
    if (this.savingPassword) {
      return;
    }

    this.passwordError = '';
    this.passwordSuccess = false;

    if (!this.currentPassword || !this.newPassword || !this.confirmNewPassword) {
      this.passwordError = 'Preenche todos os campos.';
      return;
    }

    if (this.newPassword.length < 6) {
      this.passwordError = 'A nova palavra-passe deve ter pelo menos 6 caracteres.';
      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.passwordError = 'A nova palavra-passe e a confirmação não coincidem.';
      return;
    }

    this.savingPassword = true;

    this.authService
      .changePassword(this.currentPassword, this.newPassword, this.confirmNewPassword)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingPassword = false;
          this.passwordSuccess = true;
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmNewPassword = '';
        },
        error: error => {
          this.savingPassword = false;
          const apiError = error?.error;
          const rawMessage =
            apiError?.message ??
            (Array.isArray(apiError?.errors)
              ? Object.values(apiError.errors as Record<string, string[]>).flat().join(' ')
              : null);
          this.passwordError =
            translateApiMessage(rawMessage) || 'Não foi possível alterar a palavra-passe.';
        }
      });
  }
}

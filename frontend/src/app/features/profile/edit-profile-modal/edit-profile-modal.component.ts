import { Component, DestroyRef, EventEmitter, Input, Output, inject, OnChanges } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { switchMap, of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import type { User } from '../../../core/models/user.model';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent, ModalComponent, LoadingSpinnerComponent],
  templateUrl: './edit-profile-modal.component.html',
  styleUrl: './edit-profile-modal.component.scss'
})
export class EditProfileModalComponent implements OnChanges {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) user!: User;
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<User>();

  readonly maxBioLength = 160;
  readonly maxImageBytes = 10 * 1024 * 1024;

  displayName = '';
  bio = '';
  selectedPhoto: File | null = null;
  photoPreviewUrl: string | null = null;
  saving = false;
  error = '';

  ngOnChanges(): void {
    if (this.user) {
      this.displayName = this.user.displayName ?? this.user.username;
      this.bio = this.user.bio ?? '';
    }
  }

  get photoPreview(): string | undefined {
    return this.photoPreviewUrl ?? this.user?.profilePhotoUrl;
  }

  get remainingBioChars(): number {
    return this.maxBioLength - this.bio.length;
  }

  handlePhotoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.error = 'Selecciona um ficheiro de imagem válido.';
      input.value = '';
      return;
    }

    if (file.size > this.maxImageBytes) {
      this.error = 'A imagem não pode exceder 10 MB.';
      input.value = '';
      return;
    }

    this.selectedPhoto = file;
    if (this.photoPreviewUrl) {
      URL.revokeObjectURL(this.photoPreviewUrl);
    }
    this.photoPreviewUrl = URL.createObjectURL(file);
    input.value = '';
  }

  handleClose(): void {
    this.resetPhotoSelection();
    this.error = '';
    this.closed.emit();
  }

  save(): void {
    if (!this.user || this.saving) {
      return;
    }

    this.saving = true;
    this.error = '';

    this.userService
      .updateProfile(this.user.id, {
        displayName: this.displayName.trim() || this.user.username,
        bio: this.bio.trim()
      })
      .pipe(
        switchMap(updatedUser => {
          if (this.selectedPhoto) {
            return this.userService.uploadPhoto(this.user.id, this.selectedPhoto);
          }
          return of(updatedUser);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: updatedUser => {
          this.authService.updateCurrentUser(updatedUser);
          this.saving = false;
          this.resetPhotoSelection();
          this.saved.emit(updatedUser);
          this.closed.emit();
        },
        error: () => {
          this.saving = false;
          this.error = 'Não foi possível guardar o perfil. Tenta novamente.';
        }
      });
  }

  private resetPhotoSelection(): void {
    if (this.photoPreviewUrl) {
      URL.revokeObjectURL(this.photoPreviewUrl);
    }
    this.selectedPhoto = null;
    this.photoPreviewUrl = null;
  }
}

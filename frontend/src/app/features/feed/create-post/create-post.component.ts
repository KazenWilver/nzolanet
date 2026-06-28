import { Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicationService } from '../../../core/services/publication.service';
import { AuthService } from '../../../core/services/auth.service';
import type { User } from '../../../core/models/user.model';
import type { Publication } from '../../../core/models/publication.model';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent, LoadingSpinnerComponent],
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.scss'
})
export class CreatePostComponent implements OnInit {
  private readonly publicationService = inject(PublicationService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() modoModal = false;
  @Output() postCriado = new EventEmitter<Publication>();
  @Output() cancelado = new EventEmitter<void>();

  readonly maxChars = 280;

  currentUser: User | null = null;
  formOpen = false;
  text = '';
  selectedFile: File | null = null;
  mediaType: 'image' | 'video' | null = null;
  previewUrl: string | null = null;
  publishing = false;
  error = '';

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser = user;
      });

    if (this.modoModal) {
      this.formOpen = true;
    }
  }

  get remainingChars(): number {
    return this.maxChars - this.text.length;
  }

  get canPublish(): boolean {
    return (this.text.trim().length > 0 || !!this.selectedFile) && !this.publishing;
  }

  get displayName(): string {
    return this.currentUser?.displayName ?? this.currentUser?.username ?? 'Utilizador';
  }

  openForm(): void {
    this.formOpen = true;
  }

  cancel(): void {
    this.resetForm();
    if (this.modoModal) {
      this.cancelado.emit();
    }
  }

  private resetForm(): void {
    this.formOpen = false;
    this.text = '';
    this.removeMedia();
    this.error = '';
  }

  selectFile(event: Event, type: 'image' | 'video'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];
    this.selectedFile = file;
    this.mediaType = type;
    this.previewUrl = URL.createObjectURL(file);
    this.error = '';
    input.value = '';
  }

  removeMedia(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
    this.selectedFile = null;
    this.mediaType = null;
    this.previewUrl = null;
  }

  publish(): void {
    if (!this.canPublish) {
      return;
    }

    this.publishing = true;
    this.error = '';

    const formData = new FormData();
    if (this.text.trim()) {
      formData.append('Text', this.text.trim());
    }
    if (this.mediaType === 'image' && this.selectedFile) {
      formData.append('Image', this.selectedFile);
    }
    if (this.mediaType === 'video' && this.selectedFile) {
      formData.append('Video', this.selectedFile);
    }

    this.publicationService.create(formData).subscribe({
      next: publication => {
        this.postCriado.emit(publication);
        this.publishing = false;
        this.resetForm();
      },
      error: () => {
        this.publishing = false;
        this.error = 'Erro ao publicar. Verifica o ficheiro e tenta novamente (máx. 30MB para vídeos).';
      }
    });
  }

  adjustHeight(event: Event): void {
    const element = event.target as HTMLTextAreaElement;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  }
}

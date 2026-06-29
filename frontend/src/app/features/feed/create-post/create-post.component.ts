import { Component, DestroyRef, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicationService } from '../../../core/services/publication.service';
import { AuthService } from '../../../core/services/auth.service';
import { translateApiMessage } from '../../../core/helpers/translate-api-message.helper';
import type { User } from '../../../core/models/user.model';
import type { Publication } from '../../../core/models/publication.model';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AnimationService } from '../../../core/services/animation.service';
import { PressScaleDirective } from '../../../shared/directives/press-scale.directive';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent, LoadingSpinnerComponent, ConfirmDialogComponent, PressScaleDirective],
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.scss'
})
export class CreatePostComponent implements OnInit {
  private readonly publicationService = inject(PublicationService);
  private readonly authService = inject(AuthService);
  private readonly animationService = inject(AnimationService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('composerForm') composerFormRef?: ElementRef<HTMLFormElement>;

  @Input() modoModal = false;
  @Output() postCriado = new EventEmitter<Publication>();
  @Output() cancelado = new EventEmitter<void>();

  readonly maxChars = 280;
  readonly maxImageBytes = 10 * 1024 * 1024;
  readonly maxVideoBytes = 50 * 1024 * 1024;
  readonly maxTextareaHeight = 200;

  currentUser: User | null = null;
  formOpen = false;
  text = '';
  selectedFile: File | null = null;
  mediaType: 'image' | 'video' | null = null;
  previewUrl: string | null = null;
  publishing = false;
  error = '';
  discardDialogOpen = false;

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser = user;
      });

    if (this.modoModal) {
      this.formOpen = true;
      requestAnimationFrame(() => {
        const form = this.composerFormRef?.nativeElement;
        if (form) {
          this.animationService.enter(form, 'fadeUp');
        }
      });
    }
  }

  get remainingChars(): number {
    return this.maxChars - this.text.length;
  }

  get canPublish(): boolean {
    return (this.text.trim().length > 0 || !!this.selectedFile) && !this.publishing;
  }

  get hasDraft(): boolean {
    return this.text.trim().length > 0 || !!this.selectedFile;
  }

  get displayName(): string {
    return this.currentUser?.displayName ?? this.currentUser?.username ?? 'Utilizador';
  }

  openForm(): void {
    this.formOpen = true;
    requestAnimationFrame(() => {
      const form = this.composerFormRef?.nativeElement;
      if (form) {
        this.animationService.enter(form, 'fadeUp');
      }
    });
  }

  cancel(): void {
    if (this.hasDraft) {
      this.discardDialogOpen = true;
      return;
    }

    this.resetForm();
    if (this.modoModal) {
      this.cancelado.emit();
    }
  }

  confirmDiscard(): void {
    this.discardDialogOpen = false;
    this.resetForm();
    if (this.modoModal) {
      this.cancelado.emit();
    }
  }

  handleTextareaKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'Enter' && this.canPublish) {
      event.preventDefault();
      this.publish();
    }
  }

  private resetForm(): void {
    if (!this.modoModal) {
      this.formOpen = false;
    }
    this.text = '';
    this.removeMedia();
    this.error = '';
    this.publishing = false;
  }

  selectFile(event: Event, type: 'image' | 'video'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];

    if (type === 'image') {
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
    }

    if (type === 'video') {
      if (!file.type.startsWith('video/')) {
        this.error = 'Selecciona um ficheiro de vídeo válido.';
        input.value = '';
        return;
      }
      if (file.size > this.maxVideoBytes) {
        this.error = 'O vídeo não pode exceder 50 MB.';
        input.value = '';
        return;
      }
    }

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

    this.publicationService
      .create(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: publication => {
        this.postCriado.emit(publication);
        this.publishing = false;
        this.resetForm();
      },
      error: (error: HttpErrorResponse) => {
        this.publishing = false;
        const apiMessage = error.error?.message ?? error.error?.Message;
        this.error =
          translateApiMessage(apiMessage) ||
          'Erro ao publicar. Verifica o ficheiro e tenta novamente (máx. 10 MB imagem, 50 MB vídeo).';
      }
    });
  }

  adjustHeight(event: Event): void {
    const element = event.target as HTMLTextAreaElement;
    element.style.height = 'auto';
    const nextHeight = Math.min(element.scrollHeight, this.maxTextareaHeight);
    element.style.height = `${nextHeight}px`;
    element.style.overflowY = element.scrollHeight > this.maxTextareaHeight ? 'auto' : 'hidden';
  }
}

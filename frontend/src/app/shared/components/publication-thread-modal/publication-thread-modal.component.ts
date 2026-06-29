import {
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommentService } from '../../../core/services/comment.service';
import { AuthService } from '../../../core/services/auth.service';
import type { Comment } from '../../../core/models/comment.model';
import type { Publication } from '../../../core/models/publication.model';
import type { User } from '../../../core/models/user.model';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { AvatarComponent } from '../avatar/avatar.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-publication-thread-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TimeAgoPipe,
    AvatarComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './publication-thread-modal.component.html',
  styleUrl: './publication-thread-modal.component.scss'
})
export class PublicationThreadModalComponent implements OnChanges, OnDestroy {
  private readonly commentService = inject(CommentService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) publication!: Publication;
  @Input() open = false;
  @Input() mediaFocus = false;
  @Input() videoStartTime = 0;
  @Output() closed = new EventEmitter<void>();
  @Output() countChange = new EventEmitter<number>();

  @ViewChild('modalVideo') modalVideoRef?: ElementRef<HTMLVideoElement>;

  comments: Comment[] = [];
  loading = true;
  loadError = false;
  currentUser: User | null = null;

  newCommentText = '';
  selectedFile: File | null = null;
  mediaType: 'image' | 'video' | null = null;
  previewUrl: string | null = null;
  submitting = false;
  submitError = '';

  readonly maxImageBytes = 10 * 1024 * 1024;
  readonly maxVideoBytes = 50 * 1024 * 1024;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue === true) {
      this.loadComments();
      document.body.style.overflow = 'hidden';
      if (this.useMediaLayout && this.publication?.videoUrl) {
        setTimeout(() => this.syncModalVideo(), 0);
      }
    }

    if (changes['open']?.currentValue === false) {
      this.pauseModalVideo();
      document.body.style.overflow = '';
      this.resetComposer();
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.open) {
      this.handleClose();
    }
  }

  ngOnDestroy(): void {
    this.pauseModalVideo();
    document.body.style.overflow = '';
    this.clearMediaPreview();
  }

  get hasPublicationMedia(): boolean {
    return !!(this.publication?.imageUrl || this.publication?.videoUrl);
  }

  get useMediaLayout(): boolean {
    return this.mediaFocus && this.hasPublicationMedia;
  }

  get authorName(): string {
    return this.publication?.authorDisplayName ?? this.publication?.authorUsername ?? '';
  }

  get canSubmit(): boolean {
    return !!(this.newCommentText.trim() || this.selectedFile) && !this.submitting && !!this.currentUser;
  }

  handleClose(): void {
    this.closed.emit();
  }

  handleBackdropClick(): void {
    this.handleClose();
  }

  selectFile(event: Event, type: 'image' | 'video'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];

    if (type === 'image') {
      if (!file.type.startsWith('image/')) {
        this.submitError = 'Selecciona um ficheiro de imagem válido.';
        input.value = '';
        return;
      }
      if (file.size > this.maxImageBytes) {
        this.submitError = 'A imagem não pode exceder 10 MB.';
        input.value = '';
        return;
      }
    }

    if (type === 'video') {
      if (!file.type.startsWith('video/')) {
        this.submitError = 'Selecciona um ficheiro de vídeo válido.';
        input.value = '';
        return;
      }
      if (file.size > this.maxVideoBytes) {
        this.submitError = 'O vídeo não pode exceder 50 MB.';
        input.value = '';
        return;
      }
    }

    this.clearMediaPreview();
    this.selectedFile = file;
    this.mediaType = type;
    this.previewUrl = URL.createObjectURL(file);
    this.submitError = '';
    input.value = '';
  }

  removeMedia(): void {
    this.clearMediaPreview();
    this.selectedFile = null;
    this.mediaType = null;
  }

  submitComment(): void {
    const text = this.newCommentText.trim();
    if ((!text && !this.selectedFile) || this.submitting || !this.currentUser) {
      return;
    }

    this.submitting = true;
    this.submitError = '';

    const formData = new FormData();
    if (text) {
      formData.append('text', text);
    }
    if (this.mediaType === 'image' && this.selectedFile) {
      formData.append('image', this.selectedFile);
    }
    if (this.mediaType === 'video' && this.selectedFile) {
      formData.append('video', this.selectedFile);
    }

    this.commentService
      .createWithMedia(this.publication.id, formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: comment => {
        this.comments = this.sortByCreatedAtDesc([comment, ...this.comments]);
        this.countChange.emit(this.comments.length);
        this.resetComposer();
        this.submitting = false;
      },
      error: () => {
        this.submitting = false;
        this.submitError = 'Não foi possível publicar a resposta.';
      }
    });
  }

  getAuthorName(comment: Comment): string {
    return comment.authorDisplayName ?? comment.authorUsername;
  }

  trackById(_: number, comment: Comment): string {
    return comment.id;
  }

  private loadComments(): void {
    this.loading = true;
    this.loadError = false;

    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser = user;
      });

    this.commentService
      .getByPublication(this.publication.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: comments => {
        this.comments = this.sortByCreatedAtDesc(comments);
        this.loading = false;
        this.countChange.emit(this.comments.length);
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  private resetComposer(): void {
    this.newCommentText = '';
    this.removeMedia();
    this.submitError = '';
  }

  private clearMediaPreview(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
    this.previewUrl = null;
  }

  private sortByCreatedAtDesc(comments: Comment[]): Comment[] {
    return [...comments].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  }

  private syncModalVideo(): void {
    const video = this.modalVideoRef?.nativeElement;
    if (!video) {
      return;
    }

    const startAt = this.videoStartTime;
    const startPlayback = (): void => {
      if (startAt > 0 && Number.isFinite(startAt)) {
        video.currentTime = startAt;
      }
      void video.play().catch(() => {});
    };

    if (video.readyState >= 1) {
      startPlayback();
      return;
    }

    video.addEventListener('loadedmetadata', startPlayback, { once: true });
  }

  private pauseModalVideo(): void {
    const video = this.modalVideoRef?.nativeElement;
    video?.pause();
  }
}

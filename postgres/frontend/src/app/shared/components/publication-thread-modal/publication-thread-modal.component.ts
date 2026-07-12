import {
  AfterViewChecked,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AnimationService } from '../../../core/services/animation.service';
import { CommentService } from '../../../core/services/comment.service';
import { AuthService } from '../../../core/services/auth.service';
import { PublicationService } from '../../../core/services/publication.service';
import { ScrollLockService } from '../../../core/services/scroll-lock.service';
import { FocusTrapService } from '../../../core/services/focus-trap.service';
import { RelativeTimeService } from '../../../core/services/relative-time.service';
import type { Comment } from '../../../core/models/comment.model';
import type { Publication } from '../../../core/models/publication.model';
import type { User } from '../../../core/models/user.model';
import { LinkifyTextPipe } from '../../pipes/linkify-text.pipe';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { AvatarComponent } from '../avatar/avatar.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { MentionAutocompleteDirective } from '../../directives/mention-autocomplete.directive';

@Component({
  selector: 'app-publication-thread-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TimeAgoPipe,
    LinkifyTextPipe,
    AvatarComponent,
    LoadingSpinnerComponent,
    MentionAutocompleteDirective
  ],
  templateUrl: './publication-thread-modal.component.html',
  styleUrl: './publication-thread-modal.component.scss'
})
export class PublicationThreadModalComponent implements OnChanges, OnDestroy, OnInit, AfterViewChecked {
  private readonly commentService = inject(CommentService);
  private readonly authService = inject(AuthService);
  private readonly publicationService = inject(PublicationService);
  private readonly animationService = inject(AnimationService);
  private readonly scrollLock = inject(ScrollLockService);
  private readonly focusTrap = inject(FocusTrapService);
  private readonly destroyRef = inject(DestroyRef);
  readonly relativeTime = inject(RelativeTimeService);

  @Input({ required: true }) publication!: Publication;
  @Input() open = false;
  @Input() embedded = false;
  @Input() mediaFocus = false;
  @Input() videoStartTime = 0;
  @Output() closed = new EventEmitter<void>();
  @Output() countChange = new EventEmitter<number>();
  @Output() publicationChange = new EventEmitter<Publication>();

  @ViewChild('modalVideo') modalVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('threadOverlay') threadOverlayRef?: ElementRef<HTMLElement>;
  @ViewChild('threadShell') threadShellRef?: ElementRef<HTMLElement>;
  @ViewChild('likeButton') likeButtonRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('replyTextarea') replyTextareaRef?: ElementRef<HTMLTextAreaElement>;

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
  likingInProgress = false;
  likeError = '';

  private commentsLoadedForId?: string;
  private pendingModalAnimation = false;

  readonly maxImageBytes = 10 * 1024 * 1024;
  readonly maxVideoBytes = 50 * 1024 * 1024;

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const publicationChanged =
      !!changes['publication'] &&
      changes['publication'].currentValue?.id !== changes['publication'].previousValue?.id;

    if (publicationChanged && !changes['publication'].firstChange) {
      this.comments = [];
      this.commentsLoadedForId = undefined;
    }

    const isOpen = this.embedded || this.open || changes['open']?.currentValue === true;

    const openingOverlay =
      !this.embedded &&
      this.open &&
      (changes['open']?.previousValue !== true || changes['open']?.firstChange);

    const shouldLoadComments =
      isOpen &&
      (
        publicationChanged ||
        (changes['publication']?.firstChange && !!changes['publication'].currentValue) ||
        openingOverlay ||
        changes['embedded']?.currentValue === true
      );

    if (shouldLoadComments) {
      this.loadComments();
      if (this.useMediaLayout && this.publication?.videoUrl) {
        setTimeout(() => this.syncModalVideo(), 0);
      }
    }

    if (openingOverlay) {
      this.scrollLock.lock();
      this.pendingModalAnimation = true;
    }

    if (!this.embedded && changes['open']?.currentValue === false) {
      this.pauseModalVideo();
      this.focusTrap.deactivate();
      this.scrollLock.unlock();
      this.resetComposer();
    }
  }

  ngAfterViewChecked(): void {
    if (this.pendingModalAnimation && this.threadOverlayRef && this.threadShellRef) {
      this.pendingModalAnimation = false;
      this.animateModalOpen();
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.open && !this.embedded) {
      this.handleClose();
    }
  }

  ngOnDestroy(): void {
    if (!this.embedded) {
      this.pauseModalVideo();
      this.focusTrap.deactivate();
      this.scrollLock.forceUnlock();
    }
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
    this.focusTrap.deactivate();
    if (!this.embedded) {
      this.scrollLock.forceUnlock();
    }
    this.closed.emit();
  }

  handleBackdropClick(): void {
    this.handleClose();
  }

  toggleLike(): void {
    if (this.likingInProgress) {
      return;
    }

    const previousLiked = this.publication.hasLiked ?? false;
    const previousCount = this.publication.likesCount;

    this.publication = {
      ...this.publication,
      hasLiked: !previousLiked,
      likesCount: previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1
    };
    this.likeError = '';
    this.publicationChange.emit(this.publication);

    if (!previousLiked) {
      const likeButton = this.likeButtonRef?.nativeElement;
      if (likeButton) {
        this.animationService.likePop(likeButton);
        this.animationService.confettiBurst(likeButton);
      }
    }

    const request$ = previousLiked
      ? this.publicationService.unlike(this.publication.id)
      : this.publicationService.like(this.publication.id);

    this.likingInProgress = true;

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.likingInProgress = false;
        },
        error: (error: HttpErrorResponse) => {
          this.publication = {
            ...this.publication,
            hasLiked: previousLiked,
            likesCount: previousCount
          };
          this.publicationChange.emit(this.publication);
          this.likeError = error.status === 409 ? '' : 'Não foi possível actualizar o baze.';
          this.likingInProgress = false;
        }
      });
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

  handleReplyKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'Enter' && this.canSubmit) {
      event.preventDefault();
      this.submitComment();
    }
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
        this.syncCommentsCount();
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
    if (this.commentsLoadedForId === this.publication.id && !this.loadError) {
      return;
    }

    this.commentsLoadedForId = this.publication.id;
    this.loading = true;
    this.loadError = false;

    this.commentService
      .getByPublication(this.publication.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: comments => {
        this.comments = this.sortByCreatedAtDesc(comments);
        this.loading = false;
        this.syncCommentsCount();
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
    this.resetReplyTextarea();
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

  private animateModalOpen(): void {
    const overlay = this.threadOverlayRef?.nativeElement;
    const shell = this.threadShellRef?.nativeElement;
    if (overlay && shell) {
      if (this.useMediaLayout) {
        this.animationService.mediaLightboxEnter(overlay, shell);
      } else {
        this.animationService.modalEnter(overlay, shell);
      }
      const closeButton = shell.querySelector<HTMLElement>(
        this.useMediaLayout ? '.thread-modal__media-close' : '.thread-modal__close'
      );
      this.focusTrap.activate(shell, closeButton ?? undefined);
    }
  }

  private syncCommentsCount(): void {
    const nextCount = this.comments.length;
    if (this.publication.commentsCount !== nextCount) {
      this.publication.commentsCount = nextCount;
    }
    this.countChange.emit(nextCount);
  }

  private resetReplyTextarea(): void {
    requestAnimationFrame(() => {
      const textarea = this.replyTextareaRef?.nativeElement;
      if (!textarea) {
        return;
      }

      textarea.value = '';
      textarea.style.height = 'auto';
      textarea.scrollTop = 0;
    });
  }
}

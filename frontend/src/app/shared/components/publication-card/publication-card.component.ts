import { Component, DestroyRef, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import type { Publication } from '../../../core/models/publication.model';
import { PublicationService } from '../../../core/services/publication.service';
import { PublicationMediaOverlayService } from '../../../core/services/publication-media-overlay.service';
import { AnimationService } from '../../../core/services/animation.service';
import { RelativeTimeService } from '../../../core/services/relative-time.service';
import { LinkifyTextPipe } from '../../pipes/linkify-text.pipe';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { AvatarComponent } from '../avatar/avatar.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-publication-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TimeAgoPipe,
    LinkifyTextPipe,
    AvatarComponent,
    ConfirmDialogComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './publication-card.component.html',
  styleUrl: './publication-card.component.scss'
})
export class PublicationCardComponent implements OnChanges {
  private readonly publicationService = inject(PublicationService);
  private readonly animationService = inject(AnimationService);
  private readonly mediaOverlay = inject(PublicationMediaOverlayService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly relativeTime = inject(RelativeTimeService);

  @Input({ required: true }) publication!: Publication;
  @Input() currentUserId?: string;
  @Input() highlighted = false;
  @Output() deleted = new EventEmitter<string>();
  @Output() updated = new EventEmitter<Publication>();

  menuOpen = false;
  deleteDialogOpen = false;
  editing = false;
  editText = '';
  savingEdit = false;
  editError = '';
  likeError = '';
  deleteError = '';
  deleting = false;
  likingInProgress = false
  repostingInProgress = false
  bookmarkingInProgress = false
  repostError = '';
  bookmarkError = ''
  imageLoadFailed = false;
  videoLoadFailed = false;
  shareFeedback = '';
  menuFixed = false;
  menuTop = 0;
  menuLeft = 0;

  @ViewChild('cardVideo') cardVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('likeButton') likeButtonRef?: ElementRef<HTMLButtonElement>;
  @ViewChild('menuButton') menuButtonRef?: ElementRef<HTMLButtonElement>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['publication']) {
      this.imageLoadFailed = false;
      this.videoLoadFailed = false;
    }
  }

  handleImageError(): void {
    this.imageLoadFailed = true;
  }

  handleVideoError(): void {
    this.videoLoadFailed = true;
  }

  get isAuthor(): boolean {
    return !!this.currentUserId && this.currentUserId === this.publication.authorId;
  }

  get authorName(): string {
    return this.publication.authorDisplayName ?? this.publication.authorUsername;
  }

  get deleteConfirmMessage(): string {
    if (this.deleteError) {
      return `${this.deleteError}\n\nTens a certeza que queres apagar esta publicação?`;
    }

    return 'Tens a certeza que queres apagar esta publicação?';
  }

  handleAvatarClick(event: MouseEvent): void {
    event.stopPropagation();
    void this.router.navigate(['/profile', this.publication.authorId]);
  }

  handleAvatarKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      void this.router.navigate(['/profile', this.publication.authorId]);
    }
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;

    if (this.menuOpen) {
      this.positionMenu();
    } else {
      this.menuFixed = false;
    }
  }

  handleCancelDelete(): void {
    this.deleteDialogOpen = false;
    this.deleteError = '';
  }

  startEdit(): void {
    this.menuOpen = false;
    this.editing = true;
    this.editText = this.publication.text ?? '';
    this.editError = '';
  }

  cancelEdit(): void {
    this.editing = false;
    this.editText = '';
    this.editError = '';
  }

  saveEdit(): void {
    const text = this.editText.trim();
    const hasMedia = !!(this.publication.imageUrl || this.publication.videoUrl);

    if ((!text && !hasMedia) || this.savingEdit) {
      return;
    }

    this.savingEdit = true;
    this.editError = '';

    this.publicationService
      .update(this.publication.id, { text })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          this.publication = updated;
          this.editing = false;
          this.savingEdit = false;
          this.updated.emit(updated);
        },
        error: () => {
          this.savingEdit = false;
          this.editError = 'Não foi possível guardar as alterações.';
        }
      });
  }

  confirmDelete(): void {
    this.menuOpen = false;
    this.deleteDialogOpen = true;
  }

  deletePublication(): void {
    if (this.deleting) {
      return;
    }

    this.deleting = true;
    this.deleteError = '';
    this.publicationService
      .delete(this.publication.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deleteDialogOpen = false;
          this.deleting = false;
          this.deleted.emit(this.publication.id);
        },
        error: () => {
          this.deleting = false;
          this.deleteError = 'Não foi possível apagar a publicação.';
        }
      });
  }

  toggleLike(event: MouseEvent): void {
    event.stopPropagation();
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
          if (error.status === 409) {
            this.publication = {
              ...this.publication,
              hasLiked: true,
              likesCount: Math.max(this.publication.likesCount, previousCount)
            };
            this.likingInProgress = false;
            return;
          }

          this.publication = {
            ...this.publication,
            hasLiked: previousLiked,
            likesCount: previousCount
          };
          this.likeError = 'Não foi possível actualizar o baze.';
          this.likingInProgress = false;
          setTimeout(() => {
            this.likeError = '';
          }, 4000);
        }
      });
  }

  toggleComments(event: MouseEvent): void {
    event.stopPropagation();
    this.navigateToPublication(false);
  }

  handleBodyClick(event: MouseEvent): void {
    if (this.editing) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest('a, button, video, .publication-card__media')) {
      return;
    }

    this.navigateToPublication(false);
  }

  handleMediaClick(event: MouseEvent): void {
    event.stopPropagation();
    this.navigateToPublication(true);
  }

  handleVideoClick(event: MouseEvent): void {
    const target = event.target as HTMLVideoElement;
    if (target.tagName !== 'VIDEO') {
      return;
    }

    const rect = target.getBoundingClientRect();
    const controlsHeight = 44;
    const clickedControls = event.clientY > rect.bottom - controlsHeight;

    if (clickedControls) {
      event.stopPropagation();
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.navigateToPublication(true);
  }

  toggleRepost(event: MouseEvent): void {
    event.stopPropagation()
    if (this.repostingInProgress) {
      return
    }

    const previousReposted = this.publication.hasReposted ?? false
    const previousCount = this.publication.repostsCount ?? 0

    this.publication = {
      ...this.publication,
      hasReposted: !previousReposted,
      repostsCount: previousReposted ? Math.max(0, previousCount - 1) : previousCount + 1
    }
    this.repostError = ''

    this.repostingInProgress = true
    this.publicationService
      .toggleRepost(this.publication.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.publication = {
            ...this.publication,
            hasReposted: result.hasReposted,
            repostsCount: result.repostsCount
          }
          this.repostingInProgress = false
        },
        error: () => {
          this.publication = {
            ...this.publication,
            hasReposted: previousReposted,
            repostsCount: previousCount
          }
          this.repostError = 'Não foi possível repartilhar.'
          this.repostingInProgress = false
          setTimeout(() => {
            this.repostError = ''
          }, 4000)
        }
      })
  }

  toggleBookmark(event: MouseEvent): void {
    event.stopPropagation()
    if (this.bookmarkingInProgress) {
      return
    }

    const previousBookmarked = this.publication.hasBookmarked ?? false
    const previousCount = this.publication.bookmarksCount ?? 0
    this.publication = {
      ...this.publication,
      hasBookmarked: !previousBookmarked,
      bookmarksCount: previousBookmarked ? Math.max(0, previousCount - 1) : previousCount + 1
    }
    this.bookmarkError = ''

    const request$ = previousBookmarked
      ? this.publicationService.removeBookmark(this.publication.id)
      : this.publicationService.bookmark(this.publication.id)

    this.bookmarkingInProgress = true
    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.bookmarkingInProgress = false
        },
        error: () => {
          this.publication = {
            ...this.publication,
            hasBookmarked: previousBookmarked,
            bookmarksCount: previousCount
          }
          this.bookmarkError = 'Não foi possível guardar.'
          this.bookmarkingInProgress = false
          setTimeout(() => {
            this.bookmarkError = ''
          }, 4000)
        }
      })
  }

  handleShare(event: MouseEvent): void {
    event.stopPropagation();
    const url = `${window.location.origin}/publicacoes/${this.publication.id}`;

    void navigator.clipboard.writeText(url).then(() => {
      this.shareFeedback = 'Ligação copiada';
      setTimeout(() => {
        this.shareFeedback = '';
      }, 2500);
    }).catch(() => {
      this.shareFeedback = 'Não foi possível copiar a ligação';
      setTimeout(() => {
        this.shareFeedback = '';
      }, 3000);
    });
  }

  @HostListener('document:click', ['$event'])
  closeMenuOnOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.publication-card__menu-wrap')) {
      this.menuOpen = false;
    }
  }

  private navigateToPublication(mediaFocus: boolean): void {
    if (mediaFocus && (this.publication.imageUrl || this.publication.videoUrl)) {
      const videoTime = this.getCapturedVideoTime();
      this.mediaOverlay.open(this.publication, videoTime > 0 ? Math.floor(videoTime) : 0);
      return;
    }

    void this.router.navigate(['/publicacoes', this.publication.id]);
  }

  private getCapturedVideoTime(): number {
    const video = this.cardVideoRef?.nativeElement;
    video?.pause();
    return video?.currentTime ?? 0;
  }

  private positionMenu(): void {
    const button = this.menuButtonRef?.nativeElement;
    if (!button) {
      return;
    }

    const rect = button.getBoundingClientRect();
    const menuWidth = 150;
    this.menuTop = rect.bottom + 4;
    this.menuLeft = Math.max(8, rect.right - menuWidth);
    this.menuFixed = true;
  }
}

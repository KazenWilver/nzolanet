import { Component, DestroyRef, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import type { Publication } from '../../../core/models/publication.model';
import { PublicationService } from '../../../core/services/publication.service';
import { AnimationService } from '../../../core/services/animation.service';
import { LinkifyTextPipe } from '../../pipes/linkify-text.pipe';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { AvatarComponent } from '../avatar/avatar.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { PressScaleDirective } from '../../directives/press-scale.directive';

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
    LoadingSpinnerComponent,
    PressScaleDirective
  ],
  templateUrl: './publication-card.component.html',
  styleUrl: './publication-card.component.scss'
})
export class PublicationCardComponent implements OnChanges {
  private readonly publicationService = inject(PublicationService);
  private readonly animationService = inject(AnimationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) publication!: Publication;
  @Input() currentUserId?: string;
  @Input() expandComments = false;
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
  likePulsing = false;
  likingInProgress = false;
  imageLoadFailed = false;
  videoLoadFailed = false;
  shareFeedback = '';

  @ViewChild('cardVideo') cardVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('likeButton') likeButtonRef?: ElementRef<HTMLButtonElement>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['expandComments']?.currentValue === true) {
      this.navigateToPublication(false);
    }

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
      this.likePulsing = true;
      const likeButton = this.likeButtonRef?.nativeElement;
      if (likeButton) {
        this.animationService.likePop(likeButton);
      }
      setTimeout(() => {
        this.likePulsing = false;
      }, 400);
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

  handleBodyKeydown(event: KeyboardEvent): void {
    if (this.editing) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.navigateToPublication(false);
    }
  }

  handleMediaClick(event: MouseEvent): void {
    event.stopPropagation();
    this.captureVideoTime();
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
    this.captureVideoTime();
    this.navigateToPublication(true);
  }

  handleShare(event: MouseEvent): void {
    event.stopPropagation();
    const url = `${window.location.origin}/publicacoes/${this.publication.id}`;

    void navigator.clipboard.writeText(url).then(() => {
      this.shareFeedback = 'Ligação copiada';
      setTimeout(() => {
        this.shareFeedback = '';
      }, 2500);
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
    void this.router.navigate(['/publicacoes', this.publication.id], {
      queryParams: mediaFocus ? { media: '1' } : undefined
    });
  }

  private captureVideoTime(): void {
    this.cardVideoRef?.nativeElement?.pause();
  }
}

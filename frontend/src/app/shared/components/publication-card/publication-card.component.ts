import { Component, DestroyRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import type { Publication } from '../../../core/models/publication.model';
import { PublicationService } from '../../../core/services/publication.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { AvatarComponent } from '../avatar/avatar.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { PublicationThreadModalComponent } from '../publication-thread-modal/publication-thread-modal.component';

@Component({
  selector: 'app-publication-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TimeAgoPipe,
    AvatarComponent,
    ConfirmDialogComponent,
    LoadingSpinnerComponent,
    PublicationThreadModalComponent
  ],
  templateUrl: './publication-card.component.html',
  styleUrl: './publication-card.component.scss'
})
export class PublicationCardComponent implements OnChanges {
  private readonly publicationService = inject(PublicationService);
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
  commentsOpen = false;
  threadModalOpen = false;
  threadMediaFocus = false;
  likePulsing = false;
  likingInProgress = false;
  imageLoadFailed = false;
  videoLoadFailed = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['expandComments']?.currentValue === true) {
      this.openThread(false);
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

  handleAvatarClick(): void {
    void this.router.navigate(['/profile', this.publication.authorId]);
  }

  handleAvatarKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleAvatarClick();
    }
  }

  toggleMenu(): void {
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

    if (!previousLiked) {
      this.likePulsing = true;
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

  toggleComments(): void {
    this.openThread(false);
  }

  openThread(mediaFocus: boolean): void {
    this.threadMediaFocus = mediaFocus;
    this.threadModalOpen = true;
    this.commentsOpen = true;
  }

  handleThreadClosed(): void {
    this.threadModalOpen = false;
    this.threadMediaFocus = false;
    this.commentsOpen = false;
  }

  handleMediaClick(event: MouseEvent): void {
    event.stopPropagation();
    this.openThread(true);
  }

  handleCommentsCountChange(count: number): void {
    this.publication = {
      ...this.publication,
      commentsCount: count
    };
  }

  @HostListener('document:click', ['$event'])
  closeMenuOnOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.publication-card__menu-wrap')) {
      this.menuOpen = false;
    }
  }
}

import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import type { Publication } from '../../../core/models/publication.model';
import { PublicationService } from '../../../core/services/publication.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { AvatarComponent } from '../avatar/avatar.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { CommentsSectionComponent } from '../comments-section/comments-section.component';

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
    CommentsSectionComponent
  ],
  templateUrl: './publication-card.component.html',
  styleUrl: './publication-card.component.scss'
})
export class PublicationCardComponent implements OnChanges {
  private readonly publicationService = inject(PublicationService);
  private readonly router = inject(Router);

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
  deleting = false;
  commentsOpen = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['expandComments']?.currentValue === true) {
      this.commentsOpen = true;
    }
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
    if (!text || this.savingEdit) {
      return;
    }

    this.savingEdit = true;
    this.editError = '';

    this.publicationService.update(this.publication.id, { text }).subscribe({
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
    this.publicationService.delete(this.publication.id).subscribe({
      next: () => {
        this.deleteDialogOpen = false;
        this.deleting = false;
        this.deleted.emit(this.publication.id);
      },
      error: () => {
        this.deleting = false;
        this.deleteDialogOpen = false;
      }
    });
  }

  toggleLike(): void {
    const previousLiked = this.publication.hasLiked ?? false;
    const previousCount = this.publication.likesCount;

    this.publication = {
      ...this.publication,
      hasLiked: !previousLiked,
      likesCount: previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1
    };
    this.likeError = '';

    const request$ = previousLiked
      ? this.publicationService.unlike(this.publication.id)
      : this.publicationService.like(this.publication.id);

    request$.subscribe({
      error: () => {
        this.publication = {
          ...this.publication,
          hasLiked: previousLiked,
          likesCount: previousCount
        };
        this.likeError = 'Não foi possível actualizar o baze.';
        setTimeout(() => {
          this.likeError = '';
        }, 4000);
      }
    });
  }

  toggleComments(): void {
    this.commentsOpen = !this.commentsOpen;
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

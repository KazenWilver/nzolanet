import { Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommentService } from '../../../core/services/comment.service';
import { AuthService } from '../../../core/services/auth.service';
import type { Comment } from '../../../core/models/comment.model';
import type { User } from '../../../core/models/user.model';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { RelativeTimeService } from '../../../core/services/relative-time.service';
import { AvatarComponent } from '../avatar/avatar.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-comments-section',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TimeAgoPipe,
    AvatarComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './comments-section.component.html',
  styleUrl: './comments-section.component.scss'
})
export class CommentsSectionComponent implements OnInit {
  private readonly commentService = inject(CommentService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  readonly relativeTime = inject(RelativeTimeService);

  @Input({ required: true }) publicationId!: string;
  @Output() countChange = new EventEmitter<number>();

  comments: Comment[] = [];
  loading = true;
  error = false;
  newCommentText = '';
  submitting = false;
  submitError = '';
  currentUser: User | null = null;

  editingCommentId: string | null = null;
  editText = '';
  savingEditId: string | null = null;
  deletingId: string | null = null;

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser = user;
      });

    this.loadComments();
  }

  get canSubmit(): boolean {
    return !!this.newCommentText.trim() && !this.submitting && !!this.currentUser;
  }

  loadComments(): void {
    this.loading = true;
    this.error = false;

    this.commentService
      .getByPublication(this.publicationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: comments => {
        this.comments = this.sortByCreatedAtDesc(comments);
        this.loading = false;
        this.countChange.emit(this.comments.length);
      },
      error: () => {
        this.loading = false;
        this.error = true;
      }
    });
  }

  submitComment(): void {
    const text = this.newCommentText.trim();
    if (!text || this.submitting || !this.currentUser) {
      return;
    }

    this.submitting = true;
    this.submitError = '';

    const tempId = `temp-${Date.now()}`;
    const optimisticComment: Comment = {
      id: tempId,
      text,
      createdAt: new Date().toISOString(),
      publicationId: this.publicationId,
      authorId: this.currentUser.id,
      authorUsername: this.currentUser.username,
      authorDisplayName: this.currentUser.displayName,
      authorPhotoUrl: this.currentUser.profilePhotoUrl
    };

    this.comments = this.sortByCreatedAtDesc([optimisticComment, ...this.comments]);
    this.newCommentText = '';
    this.countChange.emit(this.comments.length);

    this.commentService
      .create(this.publicationId, { text })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: comment => {
        this.comments = this.sortByCreatedAtDesc(
          this.comments.map(item => (item.id === tempId ? comment : item))
        );
        this.submitting = false;
      },
      error: () => {
        this.comments = this.comments.filter(item => item.id !== tempId);
        this.countChange.emit(this.comments.length);
        this.submitting = false;
        this.submitError = 'Não foi possível publicar o comentário.';
      }
    });
  }

  startEdit(comment: Comment): void {
    this.editingCommentId = comment.id;
    this.editText = comment.text;
  }

  cancelEdit(): void {
    this.editingCommentId = null;
    this.editText = '';
  }

  saveEdit(comment: Comment): void {
    const text = this.editText.trim();
    if (!text || this.savingEditId) {
      return;
    }

    this.savingEditId = comment.id;

    this.commentService
      .update(comment.id, { text })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: updated => {
        this.comments = this.comments.map(item => (item.id === comment.id ? updated : item));
        this.editingCommentId = null;
        this.editText = '';
        this.savingEditId = null;
      },
      error: () => {
        this.savingEditId = null;
      }
    });
  }

  deleteComment(comment: Comment): void {
    if (this.deletingId) {
      return;
    }

    this.deletingId = comment.id;
    const previousComments = [...this.comments];

    this.comments = this.comments.filter(item => item.id !== comment.id);
    this.countChange.emit(this.comments.length);

    this.commentService
      .delete(comment.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: () => {
        this.deletingId = null;
      },
      error: () => {
        this.comments = previousComments;
        this.countChange.emit(this.comments.length);
        this.deletingId = null;
      }
    });
  }

  canEdit(comment: Comment): boolean {
    return !!this.currentUser && comment.authorId === this.currentUser.id;
  }

  canDelete(comment: Comment): boolean {
    if (!this.currentUser) {
      return false;
    }
    return comment.authorId === this.currentUser.id || this.authService.estaAdmin();
  }

  getAuthorName(comment: Comment): string {
    return comment.authorDisplayName ?? comment.authorUsername;
  }

  trackById(_: number, comment: Comment): string {
    return comment.id;
  }

  private sortByCreatedAtDesc(comments: Comment[]): Comment[] {
    return [...comments].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  }
}

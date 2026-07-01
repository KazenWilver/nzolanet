import { Component, ChangeDetectorRef, EventEmitter, Input, Output, inject, OnChanges, SimpleChanges, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import type { User } from '../../../core/models/user.model';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { FollowButtonComponent } from '../../../shared/components/follow-button/follow-button.component';

type FollowersModalMode = 'followers' | 'following';

@Component({
  selector: 'app-followers-modal',
  standalone: true,
  imports: [CommonModule, AvatarComponent, ModalComponent, LoadingSpinnerComponent, FollowButtonComponent],
  templateUrl: './followers-modal.component.html',
  styleUrl: './followers-modal.component.scss'
})
export class FollowersModalComponent implements OnChanges {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  @Input() open = false;
  @Input({ required: true }) profileUserId!: string;
  @Input() mode: FollowersModalMode = 'followers';
  @Output() closed = new EventEmitter<void>();

  users: User[] = [];
  loading = false;
  error = false;
  togglingUserId: string | null = null;
  followErrorUserId: string | null = null;
  currentUserId?: string;

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['open']?.currentValue || changes['mode']) && this.open) {
      this.currentUserId = this.authService.getCurrentUser()?.id;
      this.followErrorUserId = null;
      this.loadUsers();
    }
  }

  get title(): string {
    return this.mode === 'followers' ? 'Seguidores' : 'A seguir';
  }

  get emptyMessage(): string {
    return this.mode === 'followers'
      ? 'Ainda sem seguidores.'
      : 'Ainda não segues ninguém.';
  }

  loadUsers(): void {
    this.loading = true;
    this.error = false;

    const request$ =
      this.mode === 'followers'
        ? this.userService.getFollowers(this.profileUserId)
        : this.userService.getFollowing(this.profileUserId);

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: users => {
          this.users = users;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.error = true;
        }
      });
  }

  handleClose(): void {
    this.closed.emit();
  }

  navigateToProfile(userId: string): void {
    this.handleClose();
    void this.router.navigate(['/profile', userId]);
  }

  isFollowingUser(user: User): boolean {
    return user.isFollowing === true;
  }

  isPendingUser(user: User): boolean {
    return user.isPending === true;
  }

  toggleFollow(user: User): void {
    if (!this.currentUserId || user.id === this.currentUserId || this.togglingUserId) {
      return;
    }

    this.togglingUserId = user.id;
    this.followErrorUserId = null;
    const wasFollowing = user.isFollowing === true;
    const wasPending = user.isPending === true;

    const request$ =
      wasFollowing || wasPending
        ? this.userService.unfollow(user.id)
        : this.userService.follow(user.id);

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.users = this.users.map(item => {
            if (item.id !== user.id) {
              return item;
            }

            if (wasFollowing || wasPending) {
              return { ...item, isFollowing: false, isPending: false };
            }

            if (item.isPrivate) {
              return { ...item, isFollowing: false, isPending: true };
            }

            return { ...item, isFollowing: true, isPending: false };
          });
          this.togglingUserId = null;
          this.changeDetectorRef.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.togglingUserId = null;
          this.followErrorUserId = user.id;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  getDisplayName(user: User): string {
    return user.displayName ?? user.username;
  }
}

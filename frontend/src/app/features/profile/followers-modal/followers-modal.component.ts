import { Component, EventEmitter, Input, Output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import type { User } from '../../../core/models/user.model';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

type FollowersModalMode = 'followers' | 'following';

@Component({
  selector: 'app-followers-modal',
  standalone: true,
  imports: [CommonModule, AvatarComponent, ModalComponent, LoadingSpinnerComponent],
  templateUrl: './followers-modal.component.html',
  styleUrl: './followers-modal.component.scss'
})
export class FollowersModalComponent implements OnChanges {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @Input() open = false;
  @Input({ required: true }) profileUserId!: string;
  @Input() mode: FollowersModalMode = 'followers';
  @Output() closed = new EventEmitter<void>();

  users: User[] = [];
  loading = false;
  error = false;
  togglingUserId: string | null = null;
  currentUserId?: string;

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['open']?.currentValue || changes['mode']) && this.open) {
      this.currentUserId = this.authService.getCurrentUser()?.id;
      this.loadUsers();
    }
  }

  get title(): string {
    return this.mode === 'followers' ? 'Seguidores' : 'A seguir';
  }

  loadUsers(): void {
    this.loading = true;
    this.error = false;

    const request$ =
      this.mode === 'followers'
        ? this.userService.getFollowers(this.profileUserId)
        : this.userService.getFollowing(this.profileUserId);

    request$.subscribe({
      next: users => {
        this.users = users;
        this.loading = false;
        this.markFollowingState();
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

  toggleFollow(user: User, event: MouseEvent): void {
    event.stopPropagation();

    if (!this.currentUserId || user.id === this.currentUserId || this.togglingUserId) {
      return;
    }

    this.togglingUserId = user.id;
    const wasFollowing = user.isFollowing === true;

    const request$ = wasFollowing
      ? this.userService.unfollow(user.id)
      : this.userService.follow(user.id);

    request$.subscribe({
      next: () => {
        user.isFollowing = !wasFollowing;
        this.togglingUserId = null;
      },
      error: () => {
        this.togglingUserId = null;
      }
    });
  }

  getDisplayName(user: User): string {
    return user.displayName ?? user.username;
  }

  private markFollowingState(): void {
    if (!this.currentUserId) {
      return;
    }

    this.userService.getFollowing(this.currentUserId).subscribe({
      next: following => {
        const followingIds = new Set(following.map(user => user.id));
        this.users = this.users.map(user => ({
          ...user,
          isFollowing: followingIds.has(user.id)
        }));
      }
    });
  }
}

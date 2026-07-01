import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { AnimationService } from '../../../core/services/animation.service';
import type { User } from '../../../core/models/user.model';
import { AvatarComponent } from '../avatar/avatar.component';
import { FollowButtonComponent } from '../follow-button/follow-button.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

export type WhoToFollowVariant = 'sidebar' | 'feed';

@Component({
  selector: 'app-who-to-follow',
  standalone: true,
  imports: [AvatarComponent, FollowButtonComponent, LoadingSpinnerComponent],
  templateUrl: './who-to-follow.component.html',
  styleUrl: './who-to-follow.component.scss'
})
export class WhoToFollowComponent implements OnInit {
  @Input() count = 3;
  @Input() variant: WhoToFollowVariant = 'sidebar';

  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly animationService = inject(AnimationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  suggestions: User[] = [];
  loading = false;
  error = false;
  togglingUserId: string | null = null;
  currentUserId?: string;

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUserId = user?.id;
        if (user) {
          this.loadSuggestions();
        } else {
          this.suggestions = [];
        }
      });
  }

  get isFeedVariant(): boolean {
    return this.variant === 'feed';
  }

  get shouldRender(): boolean {
    if (this.loading || this.error) {
      return true;
    }

    return this.suggestions.length >= 1;
  }

  getDisplayName(user: User): string {
    return user.displayName ?? user.username;
  }

  getBioPreview(user: User): string | null {
    const bio = user.bio?.trim();
    if (!bio) {
      return null;
    }

    return bio.length > 72 ? `${bio.slice(0, 69)}…` : bio;
  }

  navigateToProfile(userId: string): void {
    void this.router.navigate(['/profile', userId]);
  }

  handleProfileKeydown(userId: string, event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.navigateToProfile(userId);
    }
  }

  toggleFollow(user: User, event: MouseEvent): void {
    event.stopPropagation();

    if (!this.currentUserId || user.id === this.currentUserId || this.togglingUserId) {
      return;
    }

    this.togglingUserId = user.id;
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
          this.updateSuggestion(user.id, wasFollowing || wasPending ? 'unfollow' : 'follow', user.isPrivate);
          this.togglingUserId = null;
        },
        error: () => {
          this.togglingUserId = null;
        }
      });
  }

  trackById(_: number, user: User): string {
    return user.id;
  }

  private updateSuggestion(
    userId: string,
    action: 'follow' | 'unfollow',
    isPrivate: boolean
  ): void {
    this.suggestions = this.suggestions.map(item => {
        if (item.id !== userId) {
          return item;
        }

        if (action === 'unfollow') {
          return { ...item, isFollowing: false, isPending: false };
        }

        if (isPrivate) {
          return { ...item, isFollowing: false, isPending: true };
        }

        return { ...item, isFollowing: true, isPending: false };
      });
  }

  private loadSuggestions(): void {
    this.loading = true;
    this.error = false;

    this.userService
      .getSuggestions(this.count)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: users => {
          const filtered = users.filter(
            user =>
              user.id !== this.currentUserId &&
              !user.isFollowing &&
              !user.isPending
          );
          this.suggestions = filtered;
          this.loading = false;
          requestAnimationFrame(() => this.animateList());
        },
        error: () => {
          this.loading = false;
          this.error = true;
          this.suggestions = [];
        }
      });
  }

  private animateList(): void {
    const root = document.querySelector(
      this.isFeedVariant ? '.who-to-follow--feed' : '.who-to-follow--sidebar'
    );
    if (!root) {
      return;
    }

    const items = Array.from(root.querySelectorAll('.who-to-follow__item'));
    if (items.length) {
      this.animationService.staggerEnter(items, 'fadeUp', 0.06);
    }
  }
}

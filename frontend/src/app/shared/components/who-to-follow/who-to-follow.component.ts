import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import type { User } from '../../../core/models/user.model';
import { AvatarComponent } from '../avatar/avatar.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-who-to-follow',
  standalone: true,
  imports: [AvatarComponent, LoadingSpinnerComponent],
  templateUrl: './who-to-follow.component.html',
  styleUrl: './who-to-follow.component.scss'
})
export class WhoToFollowComponent implements OnInit {
  @Input() count = 3;

  private static readonly RECENT_SUGGESTIONS_KEY = 'nzolanet-recent-suggestions';
  private static readonly MAX_RECENT_SUGGESTIONS = 30;

  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
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

  getDisplayName(user: User): string {
    return user.displayName ?? user.username;
  }

  getFollowLabel(user: User): string {
    if (user.isFollowing) {
      return 'A seguir';
    }
    if (user.isPending) {
      return 'Pendente';
    }
    return 'Seguir';
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
        this.suggestions = this.suggestions.filter(item => item.id !== user.id);
        this.togglingUserId = null;
        this.loadReplacementSuggestion();
      },
      error: () => {
        this.togglingUserId = null;
      }
    });
  }

  trackById(_: number, user: User): string {
    return user.id;
  }

  private loadSuggestions(): void {
    this.loading = true;
    this.error = false;

    const excludeIds = this.getRecentSuggestionIds();

    this.userService
      .getSuggestions(this.count, excludeIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: users => {
        this.suggestions = users;
        this.rememberSuggestionIds(users.map(user => user.id));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
        this.suggestions = [];
      }
    });
  }

  private loadReplacementSuggestion(): void {
    if (this.suggestions.length >= this.count) {
      return;
    }

    this.userService
      .getSuggestions(1, this.getRecentSuggestionIds())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: users => {
        const existingIds = new Set(this.suggestions.map(user => user.id));
        const replacement = users.find(user => !existingIds.has(user.id));
        if (replacement) {
          this.suggestions = [...this.suggestions, replacement];
          this.rememberSuggestionIds([replacement.id]);
        }
      }
    });
  }

  private getRecentSuggestionIds(): string[] {
    try {
      const raw = sessionStorage.getItem(WhoToFollowComponent.RECENT_SUGGESTIONS_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private rememberSuggestionIds(ids: string[]): void {
    if (ids.length === 0) {
      return;
    }

    const merged = [...ids, ...this.getRecentSuggestionIds()]
      .filter((id, index, array) => array.indexOf(id) === index)
      .slice(0, WhoToFollowComponent.MAX_RECENT_SUGGESTIONS);

    sessionStorage.setItem(WhoToFollowComponent.RECENT_SUGGESTIONS_KEY, JSON.stringify(merged));
  }
}

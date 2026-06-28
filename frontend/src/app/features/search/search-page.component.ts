import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  switchMap,
  tap
} from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { SearchService } from '../../core/services/search.service';
import { UserService } from '../../core/services/user.service';
import type { User } from '../../core/models/user.model';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AvatarComponent, LoadingSpinnerComponent],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.scss'
})
export class SearchPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchControl = new FormControl('', { nonNullable: true });

  results: User[] = [];
  loading = false;
  error = false;
  togglingUserId: string | null = null;
  currentUserId?: string;

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.id;

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const query = params.get('q') ?? '';
      if (query !== this.searchControl.value) {
        this.searchControl.setValue(query, { emitEvent: true });
      }
    });

    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(query => {
          this.syncQueryParam(query);
          this.error = false;
        }),
        switchMap(query => {
          const trimmed = query.trim();
          if (trimmed.length < 2) {
            this.loading = false;
            return of([]);
          }

          this.loading = true;
          return this.searchService.searchUsers(trimmed).pipe(
            catchError(() => {
              this.error = true;
              return of([]);
            }),
            finalize(() => {
              this.loading = false;
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(users => {
        this.results = users;
      });
  }

  get hasQuery(): boolean {
    return this.searchControl.value.trim().length >= 2;
  }

  get currentQuery(): string {
    return this.searchControl.value.trim();
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

    request$.subscribe({
      next: () => {
        if (wasFollowing || wasPending) {
          user.isFollowing = false;
          user.isPending = false;
        } else if (user.isPrivate) {
          user.isFollowing = false;
          user.isPending = true;
        } else {
          user.isFollowing = true;
          user.isPending = false;
        }
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

  private syncQueryParam(query: string): void {
    const trimmed = query.trim();
    const current = this.route.snapshot.queryParamMap.get('q') ?? '';

    if (trimmed === current) {
      return;
    }

    void this.router.navigate(['/search'], {
      queryParams: trimmed ? { q: trimmed } : {},
      replaceUrl: true
    });
  }
}

import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { PublicationService } from '../../../core/services/publication.service';
import { FeedTabService, type FeedTab } from '../../../core/services/feed-tab.service';
import type { Publication } from '../../../core/models/publication.model';
import type { User } from '../../../core/models/user.model';
import { PublicationCardComponent } from '../../../shared/components/publication-card/publication-card.component';
import { CreatePostComponent } from '../create-post/create-post.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PublicationCardSkeletonComponent } from '../../../shared/components/publication-card-skeleton/publication-card-skeleton.component';
import { EnterAnimationDirective } from '../../../shared/directives/enter-animation.directive';
import { InfiniteScrollDirective } from '../../../shared/directives/infinite-scroll.directive';
import { PressScaleDirective } from '../../../shared/directives/press-scale.directive';
import { WhoToFollowComponent } from '../../../shared/components/who-to-follow/who-to-follow.component';

@Component({
  selector: 'app-feed-page',
  standalone: true,
  imports: [
    CommonModule,
    PublicationCardComponent,
    CreatePostComponent,
    PageHeaderComponent,
    PublicationCardSkeletonComponent,
    InfiniteScrollDirective,
    EnterAnimationDirective,
    PressScaleDirective,
    WhoToFollowComponent
  ],
  templateUrl: './feed-page.component.html',
  styleUrl: './feed-page.component.scss'
})
export class FeedPageComponent implements OnInit {
  private readonly publicationService = inject(PublicationService);
  private readonly authService = inject(AuthService);
  private readonly feedTabService = inject(FeedTabService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  publications: Publication[] = [];
  loading = true;
  loadingMore = false;
  error = false;
  loadMoreError = false;
  hasMore = false;
  currentUserId?: string;
  activeTab: FeedTab = 'para-ti';
  private page = 1;
  private feedRequestId = 0;

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.id;

    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUserId = user?.id;
        if (user) {
          this.syncAuthorProfileOnPublications(user);
        }
      });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const publicacao = params.get('publicacao');
      if (publicacao) {
        void this.router.navigate(['/publicacoes', publicacao], { replaceUrl: true });
        return;
      }

      const tab = params.get('tab');
      this.activeTab = tab === 'a-seguir' ? 'a-seguir' : 'para-ti';
      this.loadFeed(true);
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        filter(event => event.urlAfterRedirects.startsWith('/feed')),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        if (this.isFollowingTab && this.feedTabService.isFollowingStale()) {
          this.loadFeed(true);
        }
      });

    this.publicationService.created$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(publication => this.handleCreated(publication));
  }

  get isFollowingTab(): boolean {
    return this.activeTab === 'a-seguir';
  }

  get emptyMessage(): string {
    if (!this.isFollowingTab) {
      return 'Ainda não há publicações. Sê o primeiro a publicar!';
    }

    const followingCount = this.authService.getCurrentUser()?.followingCount ?? 0;
    if (followingCount === 0) {
      return 'Segue outros utilizadores para veres as publicações deles aqui.';
    }

    return 'O teu feed A Seguir está vazio. Começa por seguir mais utilizadores!';
  }

  setTab(tab: FeedTab): void {
    if (tab === this.activeTab) {
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab === 'a-seguir' ? 'a-seguir' : null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  loadFeed(reset = false): void {
    if (reset) {
      this.page = 1;
      this.publications = [];
      this.hasMore = false;
      this.loading = true;
    }

    const requestId = ++this.feedRequestId;
    this.error = false;
    if (reset) {
      this.loadMoreError = false;
    }

    const request$ = this.isFollowingTab
      ? this.publicationService.getFollowingFeed(this.page)
      : this.publicationService.getAll(this.page);

    request$
      .pipe(
        finalize(() => {
          if (requestId === this.feedRequestId) {
            this.loading = false;
            this.loadingMore = false;
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          if (requestId !== this.feedRequestId) {
            return;
          }

          const merged = reset
            ? response.items
            : this.mergePublications(this.publications, response.items);

          this.publications = this.sortByDate(merged);
          this.hasMore = response.hasMore;

          if (this.isFollowingTab) {
            this.feedTabService.clearFollowingStale();
          }
        },
        error: () => {
          if (requestId !== this.feedRequestId) {
            return;
          }

          if (reset) {
            this.error = true;
            return;
          }

          this.page = Math.max(1, this.page - 1);
          this.loadMoreError = true;
        }
      });
  }

  loadMore(): void {
    if (this.loading || this.loadingMore || !this.hasMore) {
      return;
    }

    this.loadingMore = true;
    this.page += 1;
    this.loadFeed(false);
  }

  handleCreated(publication: Publication): void {
    const isOwnPublication = publication.authorId === this.currentUserId;

    if (this.activeTab === 'para-ti') {
      this.prependPublication(publication);
      return;
    }

    if (isOwnPublication) {
      this.prependPublication(publication);
    }
  }

  handleDeleted(id: string): void {
    this.publications = this.publications.filter(publication => publication.id !== id);
  }

  handleUpdated(publication: Publication): void {
    this.publications = this.publications.map(item =>
      item.id === publication.id ? publication : item
    );
  }

  trackById(_: number, publication: Publication): string {
    return publication.id;
  }

  private prependPublication(publication: Publication): void {
    if (this.publications.some(item => item.id === publication.id)) {
      return;
    }
    this.publications = [publication, ...this.publications];
  }

  private mergePublications(existing: Publication[], incoming: Publication[]): Publication[] {
    const seen = new Set(existing.map(item => item.id));
    const appended = incoming.filter(item => !seen.has(item.id));
    return [...existing, ...appended];
  }

  private sortByDate(publications: Publication[]): Publication[] {
    return [...publications].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  }

  private syncAuthorProfileOnPublications(user: User): void {
    this.publications = this.publications.map(publication =>
      publication.authorId === user.id
        ? {
            ...publication,
            authorUsername: user.username,
            authorDisplayName: user.displayName,
            authorPhotoUrl: user.profilePhotoUrl
          }
        : publication
    );
  }
}

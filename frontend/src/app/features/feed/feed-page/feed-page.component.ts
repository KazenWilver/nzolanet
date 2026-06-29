import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { PublicationService } from '../../../core/services/publication.service';
import { FeedTabService, type FeedTab } from '../../../core/services/feed-tab.service';
import type { Publication } from '../../../core/models/publication.model';
import { PublicationCardComponent } from '../../../shared/components/publication-card/publication-card.component';
import { CreatePostComponent } from '../create-post/create-post.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-feed-page',
  standalone: true,
  imports: [CommonModule, PublicationCardComponent, CreatePostComponent, LoadingSpinnerComponent],
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
  error = false;
  currentUserId?: string;
  activeTab: FeedTab = 'para-ti';

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.id;

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const tab = params.get('tab');
      this.activeTab = tab === 'a-seguir' ? 'a-seguir' : 'para-ti';
      this.loadFeed();
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        filter(event => event.urlAfterRedirects.startsWith('/feed')),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        if (this.isFollowingTab && this.feedTabService.isFollowingStale()) {
          this.loadFeed();
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

  loadFeed(): void {
    this.loading = true;
    this.error = false;

    const request$ = this.isFollowingTab
      ? this.publicationService.getFollowingFeed()
      : this.publicationService.getAll();

    request$.subscribe({
      next: publications => {
        this.publications = this.sortByDate(publications);
        this.loading = false;

        if (this.isFollowingTab) {
          this.feedTabService.clearFollowingStale();
        }
      },
      error: () => {
        this.loading = false;
        this.error = true;
      }
    });
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

  private sortByDate(publications: Publication[]): Publication[] {
    return [...publications].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  }
}
